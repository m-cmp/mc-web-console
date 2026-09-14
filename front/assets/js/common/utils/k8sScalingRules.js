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
const waitStep = (until, label) => ({
  kind: 'wait',
  until,
  label: label || 'Wait for the CSP to apply the change',
  intervalMs: 5000,
  timeoutMs: 180000,
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
    modify: { desiredEditable: true, supportsSet: false },
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
    modify: { desiredEditable: true, supportsSet: true },
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
    modify: { desiredEditable: true, supportsSet: true, confirmOnImplicitEnable: true },
  },

  alibaba: {
    label: 'Alibaba',
    messages: {
      fixedSize: 'Alibaba switches autoscaling off and leaves the node count as it is.',
      desiredReadonly: 'Alibaba does not receive a node count with this request — only the Min/Max range is applied. '
        + 'The node count follows that range.',
      rangeRule: 'Alibaba requires 1 or more for both Min and Max.',
      confirmEnable: 'Applying a range switches autoscaling on for this node group — Alibaba has no range-only update.',
    },
    create: {
      off: { add: { on: false, min: D, max: D } },
      onRange: { minMin: 1, maxMin: 1 },
      nodeGroupAtClusterCreate: 'hidden', // CreateCluster가 NodeGroup 목록을 거부한다
      nodeGroupAtClusterCreateReason:
        'Alibaba creates node groups after the cluster exists. Create the cluster first, then use Add NodeGroup.',
      desiredIgnoredByCsp: true,
    },
    // ChangeNodeGroupScaling이 desired를 CSP 요청에 넣지 않는다
    modify: { desiredEditable: false, supportsSet: true, confirmOnImplicitEnable: true },
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
    modify: { desiredEditable: true, supportsSet: true },
  },

  nhn: {
    label: 'NHN',
    messages: {
      fixedSize: 'NHN switches autoscaling off and leaves the node count as it is.',
      desiredReadonly: 'NHN does not receive a node count with this request — only the Min/Max range is applied. '
        + 'The node count follows that range.',
      rangeRule: 'NHN fits the range around the current node count: Min must be at most, and Max at least, '
        + 'the number of nodes running now. Max cannot exceed 10.',
      confirmEnable: 'Applying a range switches autoscaling on for this node group — NHN has no range-only update.',
      // 생성 제약의 원인은 NHN이 아니라 tumblebug의 기본값 주입이다 (cb-tumblebug#2767)
      createOff: 'Simple Creation always sends a minimum node count of 1, and NHN rejects that while autoscaling is off. '
        + 'Use Expert Creation to create it with autoscaling off, or keep autoscaling on.',
    },
    create: {
      // 검증이 모두 min>0 일 때만 동작한다 → off면 min=max=0
      off: {
        expert: { on: false, min: 0, max: 0 },
        add: { on: false, min: 0, max: 0 },
        dynamic: { on: true, min: D, max: D }, // tumblebug 주입 회피
      },
      onRange: { minMin: 1, maxMax: 10 },
      nodeGroupAtClusterCreate: 'shown',
      maxNodeGroupsAtCreate: 1, // 클러스터 생성 시 첫 NodeGroup만 만들어진다
    },
    modify: {
      desiredEditable: false,
      supportsSet: true,
      confirmOnImplicitEnable: true,
      validateAgainstNodeCount: true,
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
        dynamic: { on: false, min: 0, max: 0 },
      },
      onRange: { minMin: 1 },
      desiredMin: 1,
      nodeGroupAtClusterCreate: 'shown',
      forceUncheckedAtClusterCreate: true, // 생성 경로는 autoscale을 전송하지 않아 항상 off로 생성된다
      forceUncheckedReason:
        'NCP cannot enable autoscaling while the cluster is being created. Enable it afterwards from Edit Scaling.',
    },
    // SetNodeGroupAutoScaling이 빈 구현이라 off로 되돌릴 수 없다
    modify: {
      desiredEditable: true,
      supportsSet: false,
      confirmOnEnable: true,
    },
  },

  ibm: {
    label: 'IBM',
    messages: {
      fixedSize: 'IBM switches the autoscaler off for this worker pool and leaves the node count as it is.',
      desiredReadonly: 'IBM changes the node count through the cluster autoscaler add-on — this request only updates '
        + 'the Min/Max range.',
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
    // ChangeNodeGroupScaling이 autoscaler ConfigMap의 min/max만 쓴다
    modify: { desiredEditable: false, supportsSet: true },
  },
};

// CSP별 안내 문구. 없으면 빈 문자열 — 호출부가 공통 문구로 대체한다.
export function getScalingMessage(provider, key) {
  return getRules(provider)?.messages?.[key] || '';
}

export function getRules(provider) {
  return RULES[String(provider || '').toLowerCase()] || null;
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
  const desiredEditable = isModify ? rules.modify.desiredEditable !== false : true;
  const desired = num(form?.desired, NaN);

  if (desiredEditable) {
    if (!Number.isFinite(desired)) {
      errors.push({ field: 'desired', message: 'Desired node count is required.' });
    } else {
      // tumblebug이 dynamic 경로에서 0 이하를 1로 덮어쓴다
      const desiredMin = isDynamic ? Math.max(1, rules.create.desiredMin || 0) : (rules.create.desiredMin || 0);
      if (desired < desiredMin) {
        errors.push({ field: 'desired', message: 'Desired node count must be ' + desiredMin + ' or more.' });
      }
    }
  }

  if (!form?.checked) {
    if (!isModify && rules.create.desiredIgnoredByCsp) {
      hints.push(rules.messages?.fixedSize || '');
    }
    return { ok: errors.length === 0, errors, hints };
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
    if (desiredEditable && Number.isFinite(desired) && (desired < min || desired > max)) {
      errors.push({ field: 'desired', message: 'Desired node count must be between Min and Max.' });
    }
    // NHN 드라이버는 범위를 현재 노드 수에 맞춰 말없이 보정한다 → 미리 막는다
    if (isModify && rules.modify.validateAgainstNodeCount) {
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

  if (isModify && !desiredEditable) {
    hints.push(rules.messages?.desiredReadonly || '');
  }

  if (form?.checked && rules.messages?.rangeRule) {
    hints.push(rules.messages.rangeRule);
  }

  return { ok: errors.length === 0, errors, hints: hints.filter(Boolean) };
}

// 변경할 것이 있는지 — 없으면 호출하지 않는다 (GCP는 동일값이면 드라이버가 에러를 낸다)
function hasNoChange(rules, current, target) {
  if (Boolean(current.checked) !== Boolean(target.checked)) return false;
  const desiredSame = rules.modify.desiredEditable === false
    || num(target.desired) === num(current.desired);
  if (!target.checked) return desiredSame;
  return desiredSame && num(target.min) === num(current.min) && num(target.max) === num(current.max);
}

// 현재 상태 + 목표 상태 → 호출 계획. on/off 전환이 없으면 1단계, 있으면 2단계가 된다.
export function buildModifyPlan(provider, current, target) {
  const rules = getRules(provider);
  if (!rules) {
    return { ok: false, blocked: { reason: 'Scaling is not supported for this provider.' }, confirm: null, steps: [], expected: null };
  }

  const d = rules.modify.desiredEditable === false ? num(current.desired) : num(target.desired);
  const min = num(target.min);
  const max = num(target.max);
  const on = Boolean(current.on);
  const checked = Boolean(target.checked);

  if (hasNoChange(rules, current, target)) {
    const desiredIgnored = rules.modify.desiredEditable === false
      && num(target.desired) !== num(current.desired);
    const reason = desiredIgnored
      ? rules.label + ' does not apply a node count change from here; only the autoscaling range can be changed.'
      : 'Nothing to apply — the values are unchanged.';
    return { ok: false, blocked: { reason }, confirm: null, steps: [], expected: null };
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
      // desired는 드라이버가 전달하지 않는다 → 범위만 바꾼다
      steps = checked ? [changeStep(d, min, max)] : (on ? [setStep(false)] : []);
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
        // 끄기는 Set 하나면 된다. ConfigMap 항목이 없는 경우(min/max = -1)는 read-back 이
        // 이미 "해제"로 판정하므로 이 경로로 들어오지 않는다 — 항목 생성은 위의 켜기 분기가
        // Change(항목 생성) → Set(on) 순서로 처리한다.
        steps = on ? [setStep(false)] : [];
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

  return {
    ok: true,
    blocked: null,
    confirm,
    steps,
    expected: {
      on: expectedOn,
      checked,
      desired: d,
      min: checked ? min : (steps[steps.length - 1].kind === 'change' ? steps[steps.length - 1].minNodeSize : num(current.min)),
      max: checked ? max : (steps[steps.length - 1].kind === 'change' ? steps[steps.length - 1].maxNodeSize : num(current.max)),
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
    isCreateNodeGroupSupported,
    getCreateNodeGroupUnsupportedReason,
    readBackScaling,
    buildCreateScaling,
    validateScalingForm,
    buildModifyPlan,
    describeStep,
  });
}
