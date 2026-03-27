import VideoCall from "./video-call-ui";

export default async function VideoCallPage({ searchParams }) {
  const params = await searchParams;

  const sessionId = Array.isArray(params?.sessionId)
    ? params.sessionId[0]
    : params?.sessionId;
  const token = Array.isArray(params?.token) ? params.token[0] : params?.token;
  const appId =
    process.env.NEXT_PUBLIC_VONAGE_APPLICATION_ID ||
    process.env.VONAGE_APPLICATION_ID ||
    "";

  return <VideoCall sessionId={sessionId} token={token} appId={appId} />;
}