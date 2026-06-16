export default function BackgroundVideo() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0, // Above body background, but below relative/absolute page content
        overflow: "hidden",
      }}
    >
      {/* Dark overlay to make text readable */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.3)", // Lighter 30% black overlay
          zIndex: 1, // On top of the video, behind the rest of the site
        }}
      ></div>

      {/* The video itself */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover", // Ensure it covers the whole screen without distortion
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 0,
        }}
      >
        <source src="/videos/background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
