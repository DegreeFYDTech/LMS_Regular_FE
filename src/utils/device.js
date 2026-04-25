export async function getDeviceMetadata() {
  try {
    const ipResponse = await fetch('https://ipapi.co/json/');
    const ipData = await ipResponse.json();

    return {
      success: true,
      ip: ipData.ip,
      location: `${ipData.country_name || ipData.country}, ${ipData.region}, ${ipData.city}`,
      device: {
        id: localStorage.getItem('deviceId') || (window.crypto?.randomUUID?.() || Math.random().toString(36).substring(2)),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screen: `${window.screen.width}x${window.screen.height}`,
        browser: getBrowserName(),
      },
      raw: ipData
    };
  } catch (error) {
    console.error("Metadata fetch failed", error);
    return {
      success: false,
      device: {
        id: getDeviceId(),
        userAgent: navigator.userAgent,
        browser: getBrowserName()
      }
    };
  }
}

function getBrowserName() {
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("SamsungBrowser")) return "Samsung Browser";
  if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
  if (ua.includes("Trident")) return "Internet Explorer";
  if (ua.includes("Edge")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  return "Unknown";
}

export function getDeviceId() {
  let id = localStorage.getItem('deviceId');
  if (!id) {
    id = window.crypto?.randomUUID?.() || Math.random().toString(36).substring(2);
    localStorage.setItem('deviceId', id);
  }
  return id;
}
