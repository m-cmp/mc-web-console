// ===================================================================
// K8s NodeGroup Scaling Rules — single source of truth
// ===================================================================
// 사용자는 CSP와 무관하게 같은 폼(desired → autoscaling 체크박스 → min/max)을 쓴다.
// 이 모듈이 그 입력을 CSP별로 통하는 payload와 호출 순서로 번역한다.
//
// 체크 해제 = "고정 크기(fixed size)".
//   - 진짜 off를 지원하는 CSP: onAutoScaling=false
//   - off가 불가능하거나 드라이버가 거부하는 CSP: on + min=max=desired 로 고정
//
// 근거는 cb-spider master(ec4d64055) 드라이버 코드와 cb-tumblebug main(fedf5932)이다.
// ===================================================================

export const K8S_SCALING_PATHS = { EXPERT: 'expert', ADD: 'add', DYNAMIC: 'dynamic' };

// off 인코딩에서 desired 값을 그대로 쓰겠다는 토큰
const D = 'desired';

function num(value, fallback = 0) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

// ─── 호출 스텝 생성자 ────────────────────────────────────────────────
const setStep = (on) => ({
  kind: 'set',
  on,
  label: on ? 'Turn autoscaling on' : 'Turn autoscaling off',
});
const changeStep = (desired, min, max) => ({
  kind: 'change',
  desiredNodeSize: desired,
  minNodeSize: min,
  maxNodeSize: max,
  label: 'Apply size (desired ' + desired + ', min ' + min + ', max ' + max + ')',
});
const waitStep = (until, label, options = {}) => ({
  kind: 'wait',
  until,
  label: label || 'Wait for the CSP to apply the change',
  intervalMs: 5000,
  timeoutMs: 180000,
  ...options,
});

// ─── CSP 규칙표 ──────────────────────────────────────────────────────
const RULES = {
  aws: {
    label: 'AWS',
    // 안내 문구는 CSP의 실제 제약을 그대로 설명한다 — "지원하지 않는다"로 뭉뚱그리지 않는다
    messages: {
      fixedSize: 'EKS node groups are always backed by an Auto Scaling group, so autoscaling cannot be switched off. '
        + 'The node group is pinned instead: min and max are set to the desired count.',
      rangeRule: 'AWS applies the desired, min and max node counts directly to the Auto Scaling group.',
      createOff: 'EKS node groups are always backed by an Auto Scaling group, so they cannot be created with '
        + 'autoscaling off. Keep autoscaling on and set Min/Max.',
    },
    create: {
      // 드라이버가 OnAutoScaling=false 를 거부한다 (cb-spider PR #1822)
      off: {
        expert: { on: true, min: D, max: D },
        add: { on: true, min: D, max: D },
        dynamic: { on: true, min: D, max: D },
      },
      onRange: { minMin: 0, maxMin: 1 },
      nodeGroupAtClusterCreate: 'hidden', // CreateCluster가 NodeGroup 목록을 무시한다
      nodeGroupAtClusterCreateReason:
        'AWS creates node groups after the cluster exists. Create the cluster first, then use Add NodeGroup.',
    },
    // Change 가 ASG 의 Desired/Min/Max 를 그대로 쓴다. Set 은 off 를 거부하고 on 은 무동작이다
    modify: {
      changeAppliesDesired: true,
      changeForcesEnable: false,
      set: 'none',
      offMode: 'pin',
      enableOrder: 'change-then-set',
      waitBetween: false,
    },
    // 드라이버가 OnAutoScaling을 채우지 않거나 항상 true로 보고한다 → 범위로만 판단
    readBack: (v) => v.max > v.min,
  },

  azure: {
    label: 'Azure',
    messages: {
      fixedSize: 'Azure switches the node group to manual scaling and sets the node count directly.',
      rangeRule: 'Azure requires 1 or more for Min, and Max can go up to 1000.',
      createOff: 'Simple Creation always sends a minimum node count, which Azure rejects while autoscaling is off. '
        + 'Use Expert Creation to create it with manual scaling, or keep autoscaling on.',
    },
    create: {
      off: {
        expert: { on: false, min: 0, max: 0 },
        add: { on: true, min: D, max: D }, // AddNodeGroup은 off일 때 MinCount nil 처리가 누락됨
        dynamic: { on: true, min: D, max: D }, // tumblebug이 min<=0 이면 1을 주입
      },
      onRange: { minMin: 1, maxMax: 1000 },
      nodeGroupAtClusterCreate: 'shown',
    },
    // 수동 모드의 Change 는 min=max=0 만 받는다(드라이버가 그 외를 거부). Set 은 양방향이지만
    // 현재와 같은 상태로 보내면 드라이버가 에러를 낸다 → 큐의 멱등 스킵이 막는다
    modify: {
      changeAppliesDesired: true,
      changeForcesEnable: false,
      set: 'both',
      offMode: 'manualZero',
      enableOrder: 'set-then-change',
      waitBetween: true,
    },
  },

  gcp: {
    label: 'GCP',
    messages: {
      fixedSize: 'GKE keeps the node count fixed by using the same value for min and max, then switching autoscaling off.',
      rangeRule: 'GKE requires 1 or more for Min, and the desired count must sit inside the range.',
      confirmTempEnable: 'GKE can only change the node count while autoscaling is on. '
        + 'It is switched on, the count is applied, and then it is switched off again.',
      confirmEnable: 'GKE turns autoscaling on as soon as a range is applied — there is no separate on switch.',
    },
    create: {
      off: {
        expert: { on: false, min: D, max: D }, // off면 min/max를 무시한다
        add: { on: false, min: D, max: D },
        dynamic: { on: false, min: D, max: D },
      },
      onRange: { minMin: 1 },
      nodeGroupAtClusterCreate: 'shown',
    },
    // Change 가 범위를 적용하면서 autoscaling 을 켠다. Set 은 끄기만 되고 켜기는 드라이버가 거부한다
    modify: {
      changeAppliesDesired: true,
      changeForcesEnable: true,
      set: 'off',
      offMode: 'pin',
      enableOrder: 'change-then-set',
      waitBetween: true,
    },
  },

  alibaba: {
    label: 'Alibaba',
    messages: {
      // 생성 폼 전용 문구. 수정 모달의 해제 설명은 describeOffBehavior 가 사실에서 조립한다
      fixedSize: 'Alibaba switches autoscaling off and leaves the node count as it is.',
      rangeRule: 'Alibaba requires 1 or more for both Min and Max.',
      confirmEnable: 'Applying a range switches autoscaling on for this node group — Alibaba has no range-only update.',
      confirmTempEnable: 'Alibaba can only change the range while autoscaling is on. It is switched on to apply '
        + 'Min/Max, then switched off again.',
    },
    create: {
      off: { add: { on: false, min: D, max: D } },
      onRange: { minMin: 1, maxMin: 1 },
      nodeGroupAtClusterCreate: 'hidden', // CreateCluster가 NodeGroup 목록을 거부한다
      nodeGroupAtClusterCreateReason:
        'Alibaba creates node groups after the cluster exists. Create the cluster first, then use Add NodeGroup.',
      desiredIgnoredByCsp: true,
    },
    // ChangeNodeGroupScaling이 desired를 CSP 요청에 넣지 않는다 → desired를 min=max로 인코딩한다.
    // cb-spider PR #1844 가 머지되면 changeAppliesDesired: true / changeForcesEnable: false 로 내린다
    // (그 전까지도 계획은 그대로 맞는다 — 여분 Set 은 큐의 멱등 스킵이 걸러낸다)
    modify: {
      changeAppliesDesired: false,
      changeForcesEnable: true,
      set: 'both',
      offMode: 'pin',
      enableOrder: 'change-then-set',
      waitBetween: true,
      desiredMin: 1,
    },
  },

  tencent: {
    label: 'Tencent',
    messages: {
      fixedSize: 'Tencent keeps autoscaling off and applies the node count to the scaling group.',
      rangeRule: 'Tencent requires the desired, min and max node counts to be 1 or more.',
    },
    create: {
      off: { add: { on: false, min: D, max: D } }, // 드라이버가 세 값 모두 >= 1을 요구
      onRange: { minMin: 1 },
      desiredMin: 1,
      nodeGroupAtClusterCreate: 'hidden',
      nodeGroupAtClusterCreateReason:
        'Tencent creates node groups after the cluster exists. Create the cluster first, then use Add NodeGroup.',
    },
    // Change 는 ASG 를, Set 은 노드풀 플래그를 친다 — 서로 모드를 건드리지 않는다
    modify: {
      changeAppliesDesired: true,
      changeForcesEnable: false,
      set: 'both',
      offMode: 'pin',
      enableOrder: 'set-then-change',
      waitBetween: true,
      desiredMin: 1,
    },
  },

  nhn: {
    label: 'NHN',
    messages: {
      // 생성 폼은 { on:false, min:0, max:desired } 를 한 번에 보내고 끄는 단계가 없다
      fixedSize: 'NHN switches autoscaling off and leaves the node count as it is.',
      rangeRule: 'NHN fits the range around the current node count: Min must be at most, and Max at least, '
        + 'the number of nodes running now. Max cannot exceed 10.',
      confirmEnable: 'Applying a range switches autoscaling on for this node group — NHN has no range-only update.',
      confirmTempEnable: 'NHN can only change the range while autoscaling is on. It is switched on to apply '
        + 'Min/Max, then switched off again.',
      // 생성 제약의 원인은 NHN이 아니라 tumblebug의 기본값 주입이다 (cb-tumblebug#2767)
      createOff: 'Simple Creation always sends a minimum node count of 1, and NHN rejects that while autoscaling is off. '
        + 'Use Expert Creation to create it with autoscaling off, or keep autoscaling on.',
    },
    create: {
      // 검증이 모두 min>0 일 때만 동작한다 → off면 min=max=0
      off: {
        expert: { on: false, min: 0, max: 0 },
        // NHN NodeGroup API 는 max_node_count >= 1 을 요구한다 — max 0 으로 보내면
        // "Invalid input for field/attribute max_node_count. Value: '0'" 로 거부된다.
        // 클러스터 생성 경로는 autoscale 을 라벨로 처리해 같은 값이 통과하지만 Add 는 아니다.
        // off 는 유지하고 max 만 desired 로 채운다(실측: {false, d, 0, d} 통과).
        add: { on: false, min: 0, max: D },
        dynamic: { on: true, min: D, max: D }, // tumblebug 주입 회피
      },
      onRange: { minMin: 1, maxMax: 10 },
      nodeGroupAtClusterCreate: 'shown',
      maxNodeGroupsAtCreate: 1, // 클러스터 생성 시 첫 NodeGroup만 만들어진다
    },
    modify: {
      changeAppliesDesired: false,
      changeForcesEnable: true,
      set: 'both',
      offMode: 'pin',
      enableOrder: 'change-then-set',
      waitBetween: true,
      // 드라이버가 범위를 현재 노드 수에 맞춰 말없이 보정한다 → 노드 수 도달을 기다리면 행이 된다
      clampsRangeToNodeCount: true,
      desiredMin: 1,
    },
  },

  ncp: {
    label: 'NCP',
    messages: {
      fixedSize: 'NCP has no working off switch, so the node group is pinned instead: min and max are set to the desired count.',
      rangeRule: 'NCP requires the desired, min and max node counts to be 1 or more.',
      confirmEnable: 'This node group will start scaling between Min and Max. '
        + 'NCP cannot switch autoscaling off again from this console — only a fixed size can be restored.',
      createOff: 'NCP always creates node groups with autoscaling off. Set the range after the cluster is ready.',
    },
    create: {
      off: {
        expert: { on: false, min: 0, max: 0 },
        add: { on: false, min: 0, max: 0 },
        // Simple(dynamic)은 tumblebug 이 min<=0 이면 1, max<=0 이면 2 를 주입한다. {false,0,0} 을 보내면
        // {false,1,2} 가 되어 NCP 드라이버가 "If MinNodeSize is specified, OnAutoScaling must be enabled."
        // 로 거부해 Simple 생성이 항상 실패했다. NCP 생성은 autoscale 을 적용하지 않고(NodeCount=desired)
        // 드라이버 검증은 min<=max 를 허용하므로, on + min=max=desired 로 보내면 통과하고 결과는 고정 크기다.
        dynamic: { on: true, min: D, max: D },
      },
      onRange: { minMin: 1 },
      desiredMin: 1,
      nodeGroupAtClusterCreate: 'shown',
      forceUncheckedAtClusterCreate: true, // 생성 경로는 autoscale을 적용하지 않아 항상 off로 생성된다
      forceUncheckedReason:
        'NCP cannot enable autoscaling while the cluster is being created. Enable it afterwards from Edit Scaling.',
    },
    // SetNodeGroupAutoScaling이 빈 구현이라 off로 되돌릴 수 없다 → 해제는 범위 고정으로 표현한다
    modify: {
      changeAppliesDesired: true,
      changeForcesEnable: true,
      set: 'none',
      offMode: 'pin',
      enableOrder: 'change-then-set',
      waitBetween: false,
      desiredMin: 1,
    },
  },

  ibm: {
    label: 'IBM',
    messages: {
      fixedSize: 'IBM switches the autoscaler off for this worker pool and leaves the node count as it is.',
      rangeRule: 'IBM requires 1 or more for both Min and Max.',
      unknownRange: 'The autoscaler add-on is not reporting a range yet. Applying one creates it.',
    },
    create: {
      off: {
        expert: { on: false, min: D, max: D }, // on/off 무관하게 세 값 모두 >= 1 요구
        add: { on: false, min: D, max: D },
        dynamic: { on: false, min: D, max: D },
      },
      onRange: { minMin: 1 },
      desiredMin: 1,
      nodeGroupAtClusterCreate: 'shown',
    },
    // ChangeNodeGroupScaling이 autoscaler ConfigMap의 min/max만 쓴다 → desired를 min=max로 인코딩한다.
    // Change 는 Enabled 를 건드리지 않고 ConfigMap 만 즉시 반영하므로 단계 사이 대기가 필요 없다
    modify: {
      changeAppliesDesired: false,
      changeForcesEnable: false,
      set: 'both',
      offMode: 'pin',
      enableOrder: 'change-then-set',
      waitBetween: false,
      desiredMin: 1,
    },
  },
};

// CSP별 안내 문구. 없으면 빈 문자열 — 호출부가 공통 문구로 대체한다.
export function getScalingMessage(provider, key) {
  return getRules(provider)?.messages?.[key] || '';
}

// 드라이버가 Change 로 노드 수를 직접 받지 않는 CSP 에서 desired 가 어떻게 전달되는지.
// 입력을 잠그는 대신 이 문장을 보여준다 — 화면 계약은 전 CSP 동일하다.
export function describeDesiredHandling(provider) {
  const rules = getRules(provider);
  if (!rules || rules.modify.changeAppliesDesired !== false) return '';
  return rules.label + ' does not receive a node count with this request. The desired count is applied as the '
    + 'Min/Max range (Min = Max = Desired), and the node group settles on that size.';
}

// 해제(고정 크기)가 그 CSP 에서 어떻게 구현되는지 — CSP별 문구를 두지 않고 사실에서 조립한다.
// 화면 계약은 전 CSP 동일하므로, 차이는 "무엇을 입력할 수 있는가"가 아니라 이 설명으로만 드러난다.
export function describeOffBehavior(provider, context) {
  const rules = getRules(provider);
  if (!rules) return '';
  const f = rules.modify;
  const label = rules.label;
  const out = [];

  if (f.offMode === 'manualZero') {
    out.push(label + ' switches the node group to manual scaling and sets the node count directly.');
  } else if (f.set === 'none') {
    out.push(label + ' cannot switch autoscaling off, so the node group is pinned instead: '
      + 'Min and Max are set to the desired count.');
  } else {
    out.push(label + ' pins the node group first — Min and Max are set to the desired count — '
      + 'and then switches autoscaling off.');
  }

  const desiredNote = describeDesiredHandling(provider);
  if (desiredNote) out.push(desiredNote);

  // 범위를 현재 노드 수에 맞춰 넓히는 CSP(NHN)는 노드 수가 그대로일 수 있다 → 누르기 전에 알린다
  if (f.clampsRangeToNodeCount) {
    const nodeCount = num(context?.nodeCount, NaN);
    const desired = num(context?.desired, NaN);
    if (Number.isFinite(nodeCount) && Number.isFinite(desired) && desired !== nodeCount) {
      out.push(label + ' widens the range to keep the nodes running now inside it, so the node count '
        + 'does not change from here. Nodes running now: ' + nodeCount + '.');
    }
  }

  return out.join(' ');
}

export function getRules(provider) {
  return RULES[String(provider || '').toLowerCase()] || null;
}

// 수정 경로의 Desired 바닥값. 드라이버가 Change 에서 요구하는 최소치를 따른다
// (NHN·Alibaba 는 min>=1, IBM 은 생성과 같은 1, 나머지는 0).
export function getModifyDesiredMin(provider) {
  const rules = getRules(provider);
  if (!rules) return 0;
  const fromModify = rules.modify?.desiredMin;
  if (Number.isFinite(fromModify)) return fromModify;
  const fromCreate = rules.create?.desiredMin;
  return Number.isFinite(fromCreate) ? fromCreate : 0;
}

export function isCreateNodeGroupSupported(provider, path) {
  const rules = getRules(provider);
  if (!rules) return false;
  if (path === K8S_SCALING_PATHS.ADD) return true;
  return rules.create.nodeGroupAtClusterCreate !== 'hidden';
}

export function getCreateNodeGroupUnsupportedReason(provider) {
  const rules = getRules(provider);
  return rules?.create?.nodeGroupAtClusterCreateReason || '';
}

// 조회값 → 폼 상태. 체크 판정은 "autoscaling이 켜져 있고 범위가 있는가".
export function readBackScaling(provider, raw) {
  const rules = getRules(provider);
  const on = String(raw?.onAutoScaling ?? 'false') === 'true';
  const min = num(raw?.minNodeSize, 0);
  const max = num(raw?.maxNodeSize, 0);
  const desired = num(raw?.desiredNodeSize, 0);
  const checked = rules?.readBack ? rules.readBack({ on, min, max }) : (on && max > min);
  return { checked, on, desired, min, max };
}

// 폼 입력 → 생성 payload. 항상 네 값을 모두 채운다.
export function buildCreateScaling(provider, path, form) {
  const rules = getRules(provider);
  const desired = num(form?.desired, 0);
  if (form?.checked) {
    return {
      onAutoScaling: 'true',
      desiredNodeSize: desired,
      minNodeSize: num(form.min, 0),
      maxNodeSize: num(form.max, 0),
    };
  }
  const enc = rules?.create?.off?.[path] || rules?.create?.off?.add || { on: false, min: D, max: D };
  const resolve = (v) => (v === D ? desired : num(v, 0));
  return {
    onAutoScaling: enc.on ? 'true' : 'false',
    desiredNodeSize: desired,
    minNodeSize: resolve(enc.min),
    maxNodeSize: resolve(enc.max),
  };
}

// mode: 'create:expert' | 'create:add' | 'create:dynamic' | 'modify'
export function validateScalingForm(provider, mode, form, context) {
  const rules = getRules(provider);
  const errors = [];
  const hints = [];
  if (!rules) {
    return { ok: false, errors: [{ field: 'desired', message: 'Scaling is not supported for this provider.' }], hints };
  }

  const isModify = mode === 'modify';
  const isDynamic = mode === 'create:dynamic';
  const desired = num(form?.desired, NaN);

  if (!Number.isFinite(desired)) {
    errors.push({ field: 'desired', message: 'Desired node count is required.' });
  } else {
    // 수정 경로는 드라이버가 요구하는 바닥값(Change 의 min>=1 등)을 따른다.
    // tumblebug이 dynamic 생성 경로에서 0 이하를 1로 덮어쓴다.
    const desiredMin = isModify
      ? getModifyDesiredMin(provider)
      : (isDynamic ? Math.max(1, rules.create.desiredMin || 0) : (rules.create.desiredMin || 0));
    if (desired < desiredMin) {
      errors.push({ field: 'desired', message: 'Desired node count must be ' + desiredMin + ' or more.' });
    }
  }

  if (!form?.checked) {
    if (!isModify && rules.create.desiredIgnoredByCsp) {
      hints.push(rules.messages?.fixedSize || '');
    }
    // 고정 크기로 보내도 NHN 은 범위를 현재 노드 수에 맞춰 넓힌다 → 막지 말고 미리 알린다
    if (isModify && rules.modify.clampsRangeToNodeCount && Number.isFinite(desired)) {
      hints.push(describeOffBehavior(provider, { nodeCount: context?.nodeCount, desired }));
    }
    return { ok: errors.length === 0, errors, hints: hints.filter(Boolean) };
  }

  const min = num(form?.min, NaN);
  const max = num(form?.max, NaN);
  const range = rules.create.onRange || {};

  if (!Number.isFinite(min)) errors.push({ field: 'min', message: 'Min node count is required.' });
  if (!Number.isFinite(max)) errors.push({ field: 'max', message: 'Max node count is required.' });

  if (Number.isFinite(min) && Number.isFinite(max)) {
    // min=max는 "고정 크기"라 체크 해제로 표현한다 — 그래야 저장 후 상태가 그대로 복원된다
    if (max <= min) {
      errors.push({ field: 'max', message: 'Max must be greater than Min. To keep a fixed size, turn autoscaling off.' });
    }
    if (Number.isFinite(range.minMin) && min < range.minMin) {
      errors.push({ field: 'min', message: 'Min must be ' + range.minMin + ' or more on ' + rules.label + '.' });
    }
    if (Number.isFinite(range.maxMin) && max < range.maxMin) {
      errors.push({ field: 'max', message: 'Max must be ' + range.maxMin + ' or more on ' + rules.label + '.' });
    }
    if (Number.isFinite(range.maxMax) && max > range.maxMax) {
      errors.push({ field: 'max', message: 'Max cannot exceed ' + range.maxMax + ' on ' + rules.label + '.' });
    }
    if (Number.isFinite(desired) && (desired < min || desired > max)) {
      errors.push({ field: 'desired', message: 'Desired node count must be between Min and Max.' });
    }
    // NHN 드라이버는 범위를 현재 노드 수에 맞춰 말없이 보정한다 → 미리 막는다
    if (isModify && rules.modify.clampsRangeToNodeCount) {
      const nodeCount = num(context?.nodeCount, NaN);
      if (Number.isFinite(nodeCount) && (min > nodeCount || max < nodeCount)) {
        errors.push({
          field: 'min',
          message: (rules.messages?.rangeRule || 'The range must include the current node count.')
            + ' Nodes running now: ' + nodeCount + '.',
        });
      }
    }
  }

  if (form?.checked && rules.messages?.rangeRule) {
    hints.push(rules.messages.rangeRule);
  }

  return { ok: errors.length === 0, errors, hints: hints.filter(Boolean) };
}

// 변경할 것이 있는지 — 없으면 호출하지 않는다 (GCP는 동일값이면 드라이버가 에러를 낸다)
function hasNoChange(rules, current, target) {
  if (Boolean(current.checked) !== Boolean(target.checked)) return false;
  const desiredSame = num(target.desired) === num(current.desired);
  if (!target.checked) return desiredSame;
  return desiredSame && num(target.min) === num(current.min) && num(target.max) === num(current.max);
}

// 현재 상태 + 목표 상태 → 호출 계획. on/off 전환이 없으면 1단계, 있으면 2단계가 된다.
export function buildModifyPlan(provider, current, target) {
  const rules = getRules(provider);
  if (!rules) {
    return { ok: false, blocked: { reason: 'Scaling is not supported for this provider.' }, confirm: null, steps: [], expected: null };
  }

  const d = num(target.desired);
  const min = num(target.min);
  const max = num(target.max);
  const on = Boolean(current.on);
  const checked = Boolean(target.checked);

  if (hasNoChange(rules, current, target)) {
    return {
      ok: false,
      blocked: { reason: 'Nothing to apply — the values are unchanged.' },
      confirm: null, steps: [], expected: null,
    };
  }

  // CSP 분기가 없다 — 사실표(modify)만 보고 계획을 만든다.
  // 드라이버가 고쳐지면 사실 하나를 내리면 되고, 계획 코드는 그대로다.
  const f = rules.modify;
  const canSet = (want) => (want ? f.set === 'both' : f.set === 'both' || f.set === 'off');

  let steps = [];
  if (checked) {
    if (on) {
      // 이미 켜져 있다 — 범위만 바꾼다
      steps = [changeStep(d, min, max)];
    } else if (f.enableOrder === 'set-then-change') {
      // Change 가 모드를 안 건드리는 CSP 는 먼저 켜고 범위를 넣는다
      steps = [setStep(true), waitStep({ on: true }, 'Wait until autoscaling is on'), changeStep(d, min, max)];
    } else {
      // Change 가 범위와 함께 켜 주는 CSP 는 Change 가 먼저다.
      // 뒤따르는 Set(on) 은 드라이버가 이미 켰으면 큐가 건너뛴다(멱등) — 드라이버가 더 이상
      // 강제로 켜지 않게 바뀌어도(cb-spider PR #1844) 이 계획이 그대로 맞는다
      steps = [changeStep(d, min, max)];
      if (canSet(true)) steps.push(setStep(true));
    }
  } else if (f.offMode === 'manualZero') {
    // 수동 모드로 내린 뒤 노드 수를 직접 지정한다. 이 CSP 의 Change 는 min=max=0 만 받는다
    steps = on
      ? [setStep(false), waitStep({ on: false }, 'Wait until autoscaling is off'), changeStep(d, 0, 0)]
      : [changeStep(d, 0, 0)];
  } else {
    // 해제 = 고정 크기. min=max=desired 로 범위를 좁혀 노드 수를 고정한다
    steps = [changeStep(d, d, d)];
    const willBeOn = on || f.changeForcesEnable;
    if (willBeOn && canSet(false)) {
      if (f.waitBetween) {
        // 대기 없이 Set 을 던지면 CSP 가 거부하거나(NHN 400), 노드 수가 옮겨가기 전에 굳는다(Alibaba).
        // 범위를 클램프하는 CSP(NHN)는 목표 노드 수로 수렴하지 않으므로 상태 안정만 본다
        const until = f.clampsRangeToNodeCount ? {} : { desired: d };
        steps.push(waitStep(until, 'Wait until the new size is applied', { timeoutMs: 300000 }));
      }
      steps.push(setStep(false));
    }
  }

  if (steps.length === 0) {
    return { ok: false, blocked: { reason: 'Nothing to apply — the values are unchanged.' }, confirm: null, steps: [], expected: null };
  }

  // 확인 문구도 플래그가 아니라 사실에서 파생시킨다
  let confirm = null;
  if (checked && f.set === 'none') {
    confirm = { title: 'Autoscaling cannot be switched off again', body: rules.messages?.confirmEnable || '' };
  } else if (checked && !on && f.changeForcesEnable) {
    confirm = { title: 'Autoscaling will be switched on', body: rules.messages?.confirmEnable || '' };
  } else if (!checked && !on && f.changeForcesEnable && canSet(false)) {
    confirm = { title: 'Autoscaling is switched on briefly', body: rules.messages?.confirmTempEnable || '' };
  }
  if (confirm && !confirm.body) confirm = null;

  const expectedOn = checked
    ? true
    : (steps.some((s) => s.kind === 'set' && s.on === false) ? false : on);
  // 해제 계획의 마지막 스텝은 Set 일 수 있다 — 범위는 마지막 change 스텝이 정본이다
  const lastChange = steps.slice().reverse().find((s) => s.kind === 'change');

  return {
    ok: true,
    blocked: null,
    confirm,
    steps,
    expected: {
      on: expectedOn,
      checked,
      desired: d,
      min: checked ? min : (lastChange ? lastChange.minNodeSize : num(current.min)),
      max: checked ? max : (lastChange ? lastChange.maxNodeSize : num(current.max)),
    },
  };
}

export function describeStep(step) {
  return step?.label || '';
}

if (typeof webconsolejs !== 'undefined') {
  if (typeof webconsolejs['common/utils/k8sScalingRules'] === 'undefined') {
    webconsolejs['common/utils/k8sScalingRules'] = {};
  }
  Object.assign(webconsolejs['common/utils/k8sScalingRules'], {
    K8S_SCALING_PATHS,
    getRules,
    getModifyDesiredMin,
    isCreateNodeGroupSupported,
    getCreateNodeGroupUnsupportedReason,
    readBackScaling,
    buildCreateScaling,
    validateScalingForm,
    buildModifyPlan,
    describeStep,
    getScalingMessage,
    describeOffBehavior,
    describeDesiredHandling,
  });
}
