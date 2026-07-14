declare module "*.xlsx" {
  const src: string;
  export default src;
}

declare module "*.xlsx?url" {
  const src: string;
  export default src;
}
