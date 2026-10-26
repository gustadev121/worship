export function LabelBadge({
  name,
  colorHex,
}: {
  name: string;
  colorHex: string;
}) {
  return (
    <span
      style={{
        backgroundColor: colorHex,
        borderRadius: "999px",
        color: "#fff",
        display: "inline-block",
        fontSize: "0.8rem",
        padding: "0.15rem 0.6rem",
      }}
    >
      {name}
    </span>
  );
}
