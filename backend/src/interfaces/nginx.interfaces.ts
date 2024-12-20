// Ref: https://github.com/arut/nginx-rtmp-module/wiki/Directives#on_play
export interface NginxOnPublishAuthBody {
  app: string; // application name
  flashver: string; // client flash version
  swfurl: string; //
  tcurl: string; // tcUrl
  pageurl: string; //  client page url
  addr: string; // client IP address
  clientid: string; // nginx client id (displayed in log and stat)
  call: string; // event triggering call
  name: string; // stream name
  type: string; //
}
