import { Signal } from "@preact/signals";
import { httpRequest, parseJsonResponse } from "../utils/http.utils";
import { Optional } from "../utils/type.utils";

interface AppInfo {
  version: string;
  repository: string;
  links: Record<string, string>
}

const appInfo = new Signal<Optional<AppInfo>>();

export function useAppInfo() {
  if (!appInfo.value) {
    const fetchInfo = fetch('/api/v1/')
    
    httpRequest(
      fetchInfo,
      parseJsonResponse<AppInfo>
    ).then(info => appInfo.value = info)
  }


  return appInfo;
}

