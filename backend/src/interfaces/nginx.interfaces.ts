// Ref: https://github.com/arut/nginx-rtmp-module/wiki/Directives#on_play
export interface NginxRtmpDirectiveBody {
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

export interface NginxRtmpOnUpdateBody extends NginxRtmpDirectiveBody {
  call: 'on_update';
  time: number; // The number of seconds since play/publish call
  timestamp: number; // RTMP timestamp of the last audio/video packet sent to the client
}
