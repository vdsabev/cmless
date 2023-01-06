interface Http {
  get(url: string, options?: RequestInit): Promise<any>;
  post(url: string, options?: RequestInit): Promise<any>;
  put(url: string, options?: RequestInit): Promise<any>;
  patch(url: string, options?: RequestInit): Promise<any>;
  delete(url: string, options?: RequestInit): Promise<any>;
}

declare module 'cmless/http' {
  const http: Http;
  export default http;
}
