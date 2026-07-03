const capabilities = ["YouTube / Bilibili / X", "服务器不代下载", "浏览器本机合并", "临时 Cookie 不保存"];

export function CapabilityStrip() {
  return (
    <div className="capability-strip" aria-label="核心能力">
      {capabilities.map((capability) => (
        <span className="capability-pill" key={capability}>
          <span aria-hidden="true" />
          {capability}
        </span>
      ))}
    </div>
  );
}
