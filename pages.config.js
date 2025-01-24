export default {
  root: "client",
  build: {
    command: "npm install && npm run build",
    output: "dist"
  },
  functions: {
    directory: "./functions"
  },
  routes: [
    {
      src: "/api/.*",
      dest: "/api/[[route]].ts"
    },
    {
      src: "/(.*)",
      dest: "/index.html"
    }
  ],
  env: {
    NODE_VERSION: "18"
  }
}