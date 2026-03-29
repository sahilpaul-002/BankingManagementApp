declare module "connect-rid" {
  import { RequestHandler } from "express";
  const rid: () => RequestHandler;
  export default rid;
}
