const rail = document.querySelector("aside");
const activeCase = rail?.querySelector(".desktop a[aria-current='page']");

if (activeCase && matchMedia("(min-width: 54.01rem) and (min-height: 32rem)").matches) {
  const viewport = rail.getBoundingClientRect();
  const active = activeCase.getBoundingClientRect();
  if (active.bottom > viewport.bottom || active.top < viewport.top) {
    rail.scrollTop += active.top - viewport.top - (viewport.height - active.height) / 2;
  }
}
