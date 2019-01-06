global.sleep = duration =>
  new Promise(resolve => setTimeout(resolve, duration));
