// Cloud Resources 화면 공통 — CSP 리소스 응답에서 Provider/Region 추출.
// 리소스 타입별로 응답 형태가 다름:
//  - VPC/SecurityGroup/SSHKey/DataDisk/NLB: connectionConfig.{providerName, regionDetail.regionName}
//  - Spec/Image(system)/MyImage: 최상위 providerName + regionName(Spec) 또는 regionList(Image)
// 위 필드가 없는 예외 케이스에 대비해 connectionName("<provider>-<region>" 형식)에서 추출하는 fallback 포함.

function fromConnectionName(item) {
  const connectionName = item?.connectionName;
  if (!connectionName || typeof connectionName !== 'string') return null;
  const idx = connectionName.indexOf('-');
  if (idx < 0) return null;
  return { provider: connectionName.slice(0, idx), region: connectionName.slice(idx + 1) };
}

export function getProvider(item) {
  return item?.connectionConfig?.providerName
    || item?.providerName
    || fromConnectionName(item)?.provider
    || '-';
}

export function getRegion(item) {
  const conn = item?.connectionConfig;
  if (conn?.regionDetail) return conn.regionDetail.regionName || conn.regionDetail.regionId || '-';
  if (item?.regionName) return item.regionName;
  if (Array.isArray(item?.regionList) && item.regionList.length) return item.regionList.join(', ');
  return fromConnectionName(item)?.region || '-';
}

// Provider/Region 필터 select 옵션 채우기 — 서버 커넥션 전체가 아니라
// 실제 로드된 리소스 목록(items의 _provider/_region)에서 유도한다.
// (커넥션은 있지만 리소스가 없는 provider/region까지 노출되는 것을 방지)
export function populateProviderFilterOptions(items, providerSelectId) {
  const select = document.getElementById(providerSelectId);
  if (!select) return;
  const current = select.value;
  select.innerHTML = '<option value="">-- all providers --</option>';
  const providers = [...new Set(items.map((i) => i._provider).filter((p) => p && p !== '-'))].sort();
  for (const p of providers) {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    select.appendChild(opt);
  }
  if (providers.includes(current)) select.value = current;
}

export function populateRegionFilterOptions(items, providerSelectId, regionSelectId) {
  const provider = document.getElementById(providerSelectId)?.value || '';
  const select = document.getElementById(regionSelectId);
  if (!select) return;
  const current = select.value;
  select.innerHTML = '<option value="">-- all regions --</option>';
  const filtered = provider ? items.filter((i) => i._provider === provider) : items;
  const regions = [...new Set(filtered.map((i) => i._region).filter((r) => r && r !== '-'))].sort();
  for (const r of regions) {
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = r;
    select.appendChild(opt);
  }
  if (regions.includes(current)) select.value = current;
}
