import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("test", "routes/test.tsx"),
    route("code/:code", "routes/code-register.tsx"),
] satisfies RouteConfig;
