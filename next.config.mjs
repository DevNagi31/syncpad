/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disabled: our Yjs+Awareness instances are created via useMemo and the
  // cleanup runs Doc.destroy(). Strict-mode double-mount in dev would
  // destroy the doc between the first cleanup and the second mount, leaving
  // the editor bound to a dead Y.Doc. Production isn't affected.
  reactStrictMode: false,
};
export default nextConfig;
