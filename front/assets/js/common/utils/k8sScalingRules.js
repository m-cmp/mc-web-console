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
    modify: { supportsSet: false },
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
    modify: { supportsSet: true },
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
    modify: { supportsSet: true, confirmOnImplicitEnable: true },
  },

  alibaba: {
    label: 'Alibaba',
    messages: {
      fixedSize: 'Alibaba pins the node pool: Min and Max are set to the desired count, then autoscaling is switched off.',
      desiredViaRange: 'Alibaba does not receive a node count with this request. The desired count is applied as the '
        + 'Min/Max range (Min = Max = Desired), and the node pool settles on that size.',
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
    // ChangeNodeGroupScaling이 desired를 CSP 요청에 넣지 않는다 → desired를 min=max로 인코딩한다
    modify: {
      supportsSet: true,
      confirmOnImplicitEnable: true,
      desiredAppliedViaRange: true,
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
    modify: { supportsSet: true },
  },

  nhn: {
    label: 'NHN',
    messages: {
      fixedSize: 'NHN pins the node group: Min and Max are set to the desired count, then autoscaling is switched off.',
      desiredViaRange: 'NHN does not receive a node count with this request. The desired count is applied as the '
        + 'Min/Max range (Min = Max = Desired).',
      // 드라이버가 범위를 현재 노드 수에 맞춰 넓히므로 노드 수가 그대로일 수 있다 — 미리 알린다
      fixedSizeClamped: 'NHN fits the range around the number of nodes running now, so the node count does not '
        + 'change from here. Min and Max are sent as the desired count, and NHN widens them to keep the current '
        + 'nodes inside the range.',
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
      supportsSet: true,
      confirmOnImplicitEnable: true,
      // 드라이버가 범위를 현재 노드 수에 맞춰 말없이 보정한다
      clampsRangeToNodeCount: true,
      desiredAppliedViaRange: true,
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
    // SetNodeGroupAutoScaling이 빈 구현이라 off로 되돌릴 수 없다
    modify: {
      supportsSet: false,
      confirmOnEnable: true,
    },
  },

  ibm: {
    label: 'IBM',
    messages: {
      fixedSize: 'IBM pins the worker pool: the autoscaler range is set to the desired count and the autoscaler is '
        + 'then switched off, so the node count stays where it is until the autoscaler is switched on again.',
      desiredViaRange: 'IBM changes the node count through the cluster autoscaler add-on. The desired count is '
        + 'applied as the Min/Max range (Min = Max = Desired) in the autoscaler config.',
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
    // ChangeNodeGroupScaling이 autoscaler ConfigMap의 min/max만 쓴다 → desired를 min=max로 인코딩한다
    modify: { supportsSet: true, desiredAppliedViaRange: true },
  },
};

// CSP별 안내 문구. 없으면 빈 문자열 — 호출부가 공통 문구로 대체한다.
export function getScalingMessage(provider, key) {
  return getRules(provider)?.messages?.[key] || '';
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
      const nodeCount = num(context?.nodeCount, NaN);
      if (Number.isFinite(nodeCount) && desired !== nodeCount) {
        hints.push((rules.messages?.fixedSizeClamped || '') + ' Nodes running now: ' + nodeCount + '.');
      }
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

  let steps = [];
  switch (String(provider).toLowerCase()) {
    case 'aws':
      steps = checked ? [changeStep(d, min, max)] : [changeStep(d, d, d)];
      break;

    case 'azure':
      if (checked) {
        steps = on
          ? [changeStep(d, min, max)]
          : [setStep(true), waitStep({ on: true }, 'Wait until autoscaling is on'), changeStep(d, min, max)];
      } else {
        // 수동 모드의 Change는 min=max=0 만 받는다
        steps = on
          ? [setStep(false), waitStep({ on: false }, 'Wait until autoscaling is off'), changeStep(d, 0, 0)]
          : [changeStep(d, 0, 0)];
      }
      break;

    case 'gcp':
      // Change가 off 상태를 자동으로 켜므로, 끄기는 마지막에 Set으로 마무리한다
      steps = checked
        ? [changeStep(d, min, max)]
        : [changeStep(d, d, d), waitStep({ desired: d }, 'Wait until the node count is applied'), setStep(false)];
      break;

    case 'tencent':
      if (checked) {
        steps = on
          ? [changeStep(d, min, max)]
          : [setStep(true), waitStep({ on: true }, 'Wait until autoscaling is on'), changeStep(d, min, max)];
      } else {
        steps = [changeStep(d, d, d)];
        if (on) steps.push(waitStep({ desired: d }, 'Wait until the node count is applied'), setStep(false));
      }
      break;

    case 'alibaba':
    case 'nhn':
      // 드라이버가 desired 를 버리고 enable=true 를 강제한다 → 생성 폼과 같은 인코딩(min=max=desired)으로
      // 번역하고, Change 가 켜 버린 autoscaling 을 Set(off) 로 마무리한다.
      // NHN 은 이 순서 덕분에 ca_max_node_count 가 먼저 채워져 Set 단독 호출의 409 가 사라진다.
      // 노드 수({desired})를 기다리면 안 된다 — NHN 은 범위를 클램프해 목표로 수렴하지 않아 행이 된다.
      // 대기 판정은 CSP 원본 상태(keyValueList.Status)를 본다 — tumblebug 의 Active 만 보면
      // NHN 이 아직 UPDATE_IN_PROGRESS 인데 통과해 버린다(k8sScalingQueue isSettled 참고).
      steps = checked
        ? [changeStep(d, min, max)]
        : [
          changeStep(d, d, d),
          // 대기를 건너뛰면 안 된다 — NHN 은 NodeGroup 이 UPDATE_IN_PROGRESS 인 동안 autoscale 호출을
          // 400 으로 거부한다. 못 기다렸으면 실패할 Set 을 던지는 대신 여기서 멈추고 이유를 알린다
          // NHN 실측: Change 후 수렴까지 143초·178.5초(2026-09-16) — 기본 3분으로는 여유가 없다
          waitStep({ on: true }, 'Wait until the new range is registered', { timeoutMs: 300000 }),
          setStep(false),
        ];
      break;

    case 'ncp':
      // Set이 빈 구현이라 "해제"는 범위 고정으로 표현한다
      steps = checked ? [changeStep(d, min, max)] : [changeStep(d, d, d)];
      break;

    case 'ibm':
      if (checked) {
        steps = [changeStep(d, min, max)];
        if (!on) steps.push(setStep(true));
      } else {
        // Change 는 autoscaler ConfigMap 의 min/max 만 쓰고 Enabled 는 건드리지 않는다 → 대기 불필요.
        // desired 를 min=max 로 남겨 두면 다음에 autoscaling 을 켤 때 그 크기로 시작한다.
        steps = [changeStep(d, d, d)];
        if (on) steps.push(setStep(false));
      }
      break;

    default:
      steps = checked ? [changeStep(d, min, max)] : [changeStep(d, d, d)];
  }

  // 안전장치: Set 이 동작하지 않는 CSP(AWS는 거부, NCP는 빈 구현)에는 Set 스텝을 넘기지 않는다
  if (rules.modify.supportsSet === false) {
    steps = steps.filter((step) => step.kind !== 'set');
  }

  if (steps.length === 0) {
    return { ok: false, blocked: { reason: 'Nothing to apply — the values are unchanged.' }, confirm: null, steps: [], expected: null };
  }

  let confirm = null;
  const turnsOnImplicitly = checked && !on && Boolean(rules.modify.confirmOnImplicitEnable);
  if (checked && rules.modify.confirmOnEnable) {
    confirm = { title: 'Autoscaling cannot be switched off again', body: rules.messages?.confirmEnable || '' };
  } else if (turnsOnImplicitly) {
    confirm = { title: 'Autoscaling will be switched on', body: rules.messages?.confirmEnable || '' };
  } else if (!checked && !on && rules.modify.confirmOnImplicitEnable) {
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
  });
}
