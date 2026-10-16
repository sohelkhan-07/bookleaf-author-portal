export default function Brand({ className = "" }) {
  return (
    <div
      className={`flex w-fit items-center select-none ${className}`.trim()}
      draggable={false}
    >
      <img
        src="/bookleaf-logo.png"
        alt="BookLeaf Publishing"
        draggable={false}
        onDragStart={(event) => event.preventDefault()}
        onContextMenu={(event) => event.preventDefault()}
        className="pointer-events-none block h-auto w-56 max-w-full select-none object-contain sm:w-64"
      />
    </div>
  );
}