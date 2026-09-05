export type NetworkStep = { name: string; description: string; duration: number; cached: boolean };
export function networkSteps(
  rtt: number,
  dnsCached: boolean,
  connectionWarm: boolean,
  resourceCached: boolean,
  loss: boolean,
): NetworkStep[] {
  return [
    {
      name: '查找地址',
      description: resourceCached
        ? '使用新鲜的本地资源，不需要查询地址。'
        : dnsCached
          ? '命中本地 DNS 缓存，直接得到服务器地址。'
          : '浏览器向解析器查询域名对应的 IP 地址。',
      duration: resourceCached ? 0 : dnsCached ? 2 : rtt,
      cached: dnsCached || resourceCached,
    },
    {
      name: '建立连接',
      description: resourceCached
        ? '本次读取无需网络连接。'
        : connectionWarm
          ? '复用尚未关闭的 TCP 连接。'
          : 'TCP 握手，建立可靠传输通道。',
      duration: resourceCached || connectionWarm ? 0 : rtt,
      cached: resourceCached || connectionWarm,
    },
    {
      name: '协商加密',
      description: resourceCached
        ? '本次读取无需协商加密连接。'
        : connectionWarm
          ? '现有连接已经完成 TLS 协商。'
          : 'TLS 1.3 握手，验证身份并协商会话密钥。',
      duration: resourceCached || connectionWarm ? 0 : rtt,
      cached: resourceCached || connectionWarm,
    },
    {
      name: '发出请求',
      description: resourceCached
        ? '资源缓存仍然新鲜，无需重新向服务器请求。'
        : '通过 HTTPS 请求页面，等待服务器处理。',
      duration: resourceCached ? 0 : rtt + 50,
      cached: resourceCached,
    },
    {
      name: '传输内容',
      description: resourceCached
        ? '直接读取缓存中的响应内容。'
        : loss
          ? '一个分段丢失；示意额外等待与 TCP 重传。'
          : '响应分段抵达，浏览器得到 HTML 与所需资源。',
      duration: resourceCached ? 5 : rtt + 80 + (loss ? 2 * rtt : 0),
      cached: resourceCached,
    },
    {
      name: '画出页面',
      description: '解析 HTML / CSS，完成布局、绘制与合成。',
      duration: 60,
      cached: false,
    },
  ];
}
