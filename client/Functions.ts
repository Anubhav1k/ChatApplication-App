// import { useModules } from 'hooks';

const CheckPermistions = (modules, id) => {
  // const modules = useModules();
  const module = modules.find((module) => module.moduleID === id);
  // return true;

  if (module) {
    return true;
  } else {
    return false;
  }
};

export default CheckPermistions;

export const detectBrowserAndDevice = () => {
  const UserAgent = navigator.userAgent;
  const device = {
    iPad: /iPad/.test(UserAgent),
    iPhone: /iPhone/.test(UserAgent),
    Android: /Android/.test(UserAgent),
    Windows: /Windows/.test(UserAgent),
    macOS: /Macintosh/.test(UserAgent),
    Linux: /Linux/.test(UserAgent),
    BlackBerry: /BlackBerry/.test(UserAgent),
    iPod: /iPod/.test(UserAgent),
    Samsung: /Samsung/.test(UserAgent),
    Nokia: /Nokia/.test(UserAgent),
    Sony: /Sony/.test(UserAgent),
    HTC: /HTC/.test(UserAgent),
    LG: /LG/.test(UserAgent),
    Motorola: /Motorola/.test(UserAgent),
    Nexus: /Nexus/.test(UserAgent),
    Kindle: /Kindle/.test(UserAgent),
    FirePhone: /Fire Phone/.test(UserAgent)
  };

  let browserName;

  // Checking for browser
  if (/Firefox\//.test(UserAgent)) {
    browserName = "Mozilla Firefox";
  } else if (/Edg\//.test(UserAgent)) {
    browserName = "Microsoft Edge";
  } else if (/Chrome\//.test(UserAgent)) {
    browserName = "Google Chrome";
  } else if (/Safari\//.test(UserAgent)) {
    browserName = "Apple Safari";
  } else if (/OPR\//.test(UserAgent)) {
    browserName = "Opera";
  } else if (/Trident\//.test(UserAgent)) {
    browserName = "Microsoft Internet Explorer";
  } else if (/UCBrowser\//.test(UserAgent)) {
    browserName = "UC Browser";
  } else if (/SamsungBrowser\//.test(UserAgent)) {
    browserName = "Samsung Internet";
  } else if (/MQQBrowser\//.test(UserAgent)) {
    browserName = "QQ Browser";
  } else if (/WeChat\//.test(UserAgent)) {
    browserName = "WeChat Browser";
  } else if (/Yandex\//.test(UserAgent)) {
    browserName = "Yandex Browser";
  } else if (/AppleWebKit\//.test(UserAgent)) {
    browserName = "WebKit-based Browser (unknown)";
  } else {
    browserName = "Unknown Browser";
  }
  var navigator_info = window.navigator;
  var screen_info = window.screen;
  var uid = navigator_info.mimeTypes.length.toString();
  uid += navigator_info.userAgent.replace(/\D+/g, '');
  uid += navigator_info.plugins.length.toString();
  uid += (screen_info.height || '').toString();
  uid += (screen_info.width || '').toString();
  uid += (screen_info.pixelDepth || '').toString();
  // Constructing the result object
  const result = {
    browser: browserName,
    device: Object.keys(device).find(dev => device[dev]) || "Unknown Device",
    deviceId: uid
  };

  return result;
}

export const formatLastSeen = (lastSeen: string | Date) => {
  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  const diff = now.getTime() - lastSeenDate.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 5) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return lastSeenDate.toLocaleDateString();
};