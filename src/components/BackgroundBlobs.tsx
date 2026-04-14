import { ReactNode } from "react";

interface BackgroundBlobsProps {
  children?: ReactNode;
}

export default function BackgroundBlobs({ children }: BackgroundBlobsProps) {
  return (
    <>
      <div
        className="abstract-bg"
        style={{
          width: "600px",
          height: "600px",
          background: "linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)",
          top: "-10%",
          right: "-5%",
        }}
      />
      <div
        className="abstract-bg"
        style={{
          width: "500px",
          height: "500px",
          background: "linear-gradient(135deg, #d946ef 0%, #0891b2 100%)",
          top: "30%",
          left: "10%",
        }}
      />
      <div
        className="abstract-bg"
        style={{
          width: "400px",
          height: "400px",
          background: "linear-gradient(135deg, #a855f7 0%, #06b6d4 100%)",
          bottom: "-5%",
          right: "20%",
        }}
      />
      {children}
    </>
  );
}
