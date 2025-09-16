# YouStream (Prototype PWA)

A minimal mobile-first web app you can install and run on your phone. It can:
- Preview your camera ("Go Live" area)
- Record a clip and download it
- "Publish" locally to a mock feed for the demo
- Install to home screen (PWA)

## How to use
1. Open `index.html` in a modern mobile browser (Chrome, Edge, Safari).
2. Allow camera/mic when prompted.
3. Tap **Start recording**, **Stop**, then **Download** to save a file.
4. Use **Publish (mock)** to add to the local feed.

## Making real live streaming work
Replace the placeholder with a real provider:
- **Livepeer** (simple, scalable): ingest via WebRTC or RTMP; get a `streamKey` and send tracks to their node.
- **LiveKit** (self-host or cloud): use a Room; publish `liveStream` tracks via their JS SDK.
- **Mux Live**: create a live stream, push RTMP from a mobile RTMP app or from your browser via WebRTC → RTMP bridge.

### Example (pseudo) with LiveKit
```js
import { Room, createLocalTracks } from 'livekit-client';
const room = new Room();
await room.connect('wss://YOUR_DOMAIN/livekit', 'JWT_FROM_BACKEND');
const tracks = await createLocalTracks({ audio: true, video: { facingMode: 'user' } });
tracks.forEach(t => room.localParticipant.publishTrack(t));
```

### Example (bare WebRTC outline)
```js
const pc = new RTCPeerConnection();
liveStream.getTracks().forEach(t => pc.addTrack(t, liveStream));
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);
// send offer.sdp to your signaling server over WebSocket
// receive answer.sdp and ice candidates, then setRemoteDescription(answer)
```

## Backend sketch
- **API**: Node/Express (or Next.js) with JWT auth
- **Storage**: S3-compatible (or Cloudflare R2) for uploads
- **DB**: Postgres (videos, users, streams, likes, comments)
- **CDN**: Cloudfront/Cloudflare for playback
- **Transcode**: Livepeer/Mux or your ffmpeg pipeline → HLS/DASH

## Files
- `index.html` — UI
- `styles.css` — styles
- `app.js` — camera, recording, mock feed
- `manifest.json` — PWA config
- `service-worker.js` — offline/install support
```
