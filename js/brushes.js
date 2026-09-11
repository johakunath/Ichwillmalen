/* Pigment is added to a transparent stroke layer; texture never erases older marks. */
(function () {
  const tools = [
    ["pencil", "Buntstift"],
    ["ink", "Fineliner"],
    ["crayon", "Wachsmaler"],
    ["marker", "Filzstift"],
    ["brush", "Pinsel"],
    ["water", "Wasserfarbe"],
    ["spray", "Sprühfarbe"],
    ["star", "Sternenstaub"],
    ["erase", "Radierer"],
  ];
  function illustration(key) {
    const nib = {
      pencil:
        '<path d="M13 31 18 45 23 31Z" fill="#e7c995"/><path d="m16 40 2 5 2-5Z" fill="#425a50"/>',
      ink: '<path d="M15 30h6v9h-2v6h-2v-6h-2Z" fill="#425a50"/>',
      crayon: '<path d="m12 30 6 14 6-14Z" fill="currentColor"/>',
      marker: '<path d="M13 30h10v9l-10 5Z" fill="currentColor"/>',
      brush:
        '<path d="M12 29h12v7H12Z" fill="#bcc8bf"/><path d="M12 36c-4 6 1 9 6 10 5-4 8-6 6-10Z" fill="currentColor"/>',
      water:
        '<path d="M13 30h10l-5 15Z" fill="#8bb9ca"/><path d="M18 41s-5 5-1 7c5 0 1-7 1-7Z" fill="currentColor"/>',
    }[key];
    if (!nib) return Icons(key === "spray" ? "spray" : key);
    return (
      '<svg class="pen-picture" viewBox="0 0 36 50" aria-hidden="true"><rect x="12" y="3" width="12" height="28" rx="3" fill="currentColor"/><path d="M15 6v21" stroke="#fff" opacity=".5" stroke-width="2"/>' +
      nib +
      "</svg>"
    );
  }
  function render(
    ctx,
    a,
    b,
    { brush, size, color, rainbow, mirror, width, paper },
    state,
  ) {
    const distance = Math.hypot(b.x - a.x, b.y - a.y);
    const spacing =
      brush === "star" ? Math.max(12, size * 2.8) : Math.max(0.5, size * 0.16);
    let offset = state.remaining || 0;
    state.startHue ??= state.hue;
    function dab(x, y, p) {
      const pressure = 0.25 + p * 1.5;
      const radius = Math.max(0.35, (size * pressure) / 2);
      const pigment =
        brush === "erase"
          ? paper
          : rainbow
            ? `hsl(${state.hue % 360} 70% 55%)`
            : color;
      ctx.fillStyle = pigment;
      ctx.globalAlpha = 1;
      const circle = (dx, dy, r) => {
        ctx.beginPath();
        ctx.arc(dx, dy, r, 0, Math.PI * 2);
        ctx.fill();
      };
      if (brush === "pencil" || brush === "crayon") {
        const r = radius * (brush === "pencil" ? 0.7 : 1.6);
        ctx.globalAlpha = brush === "pencil" ? 0.18 : 0.3;
        circle(x, y, r);
        ctx.globalAlpha = 0.32;
        // Small pigment flecks leave the underlying drawing visible through the grain.
        for (let i = 0; i < Math.max(2, r * 2); i++) {
          const angle = Math.random() * Math.PI * 2,
            d = Math.sqrt(Math.random()) * r;
          circle(
            x + Math.cos(angle) * d,
            y + Math.sin(angle) * d,
            Math.min(0.65, r * 0.25),
          );
        }
      } else if (brush === "spray") {
        ctx.globalAlpha = 0.18;
        for (let i = 0; i < 12; i++) {
          const angle = Math.random() * Math.PI * 2,
            d = Math.sqrt(Math.random()) * radius * 4;
          circle(
            x + Math.cos(angle) * d,
            y + Math.sin(angle) * d,
            Math.max(0.4, size * 0.055),
          );
        }
      } else if (brush === "star") {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const r = Math.max(4, radius * 2.5) * (i % 2 ? 0.43 : 1),
            angle = (i * Math.PI) / 5 - Math.PI / 2;
          const px = x + Math.cos(angle) * r,
            py = y + Math.sin(angle) * r;
          if (i) ctx.lineTo(px, py);
          else ctx.moveTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      } else if (brush === "marker") {
        ctx.beginPath();
        ctx.ellipse(
          x,
          y,
          radius * 1.8,
          Math.max(0.6, radius * 0.65),
          -0.6,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      } else if (brush === "water" || brush === "brush") {
        const r = radius * (brush === "water" ? 3 : 1.8);
        const gradient = ctx.createRadialGradient(x, y, r * 0.45, x, y, r);
        gradient.addColorStop(0, "#ffffff");
        gradient.addColorStop(1, "#ffffff00");
        ctx.fillStyle = gradient;
        circle(x, y, r);
      } else
        circle(x, y, brush === "erase" ? radius * 3 : Math.max(0.35, size / 2));
    }
    ctx.save();
    for (; offset <= distance; offset += spacing) {
      const t = distance ? offset / distance : 0;
      const x = a.x + (b.x - a.x) * t,
        y = a.y + (b.y - a.y) * t,
        p = a.p + (b.p - a.p) * t;
      state.hue += spacing * 0.35;
      dab(x, y, p);
      if (mirror) dab(width - x, y, p);
    }
    state.remaining = offset - distance;
    ctx.restore();
  }
  // Finish once after all coalesced samples in a pointer event have been added.
  function finish(ctx, { brush, color, rainbow, width }, state) {
    if (brush === "brush" || brush === "water") {
      // Tint the accumulated opacity mask once, avoiding dark rounding artifacts
      // from repeatedly compositing very faint colored edges on an 8-bit canvas.
      ctx.save();
      ctx.globalCompositeOperation = "source-in";
      ctx.globalAlpha = 1;
      if (rainbow) {
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        for (let i = 0; i <= 6; i++)
          gradient.addColorStop(
            i / 6,
            `hsl(${state.startHue + i * 60} 70% 55%)`,
          );
        ctx.fillStyle = gradient;
      } else ctx.fillStyle = color;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }
  }
  window.Brushes = {
    tools,
    illustration,
    render,
    finish,
    opacity: (key) => (key === "water" ? 0.28 : key === "marker" ? 0.8 : 1),
  };
})();
