let timer = setInterval(() => {
  fetch("/warmup");
}, 1000 * 60 * 10);

export default {};
