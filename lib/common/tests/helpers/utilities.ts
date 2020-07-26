export const makeId = (n: number): string => {
  let result = "";
  const alphaNum =
    "ABCDEFGHIJKLMNOPQRSTWXYZabcdefghijklmnopqrstuvwxyz"; // 1234567890";
  const alphaNumLength = alphaNum.length;
  for (let i = 0; i < n; ++i) {
    result += alphaNum.charAt(Math.floor(Math.random() * alphaNumLength));
  }
  return result;
};
