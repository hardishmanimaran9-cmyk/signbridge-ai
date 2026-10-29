import React, { useEffect, useRef } from 'react';
import { HandLandmarks, PoseKeypoints, FacialCues } from '../types/recognition';

interface LandmarkOverlayProps {
  landmarks: HandLandmarks[];
  pose?: PoseKeypoints;
  face?: FacialCues;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  showSkeleton?: boolean;
  showPoints?: boolean;
  showPose?: boolean;
  showFaceCues?: boolean;
  highContrast?: boolean;
  isSimulating?: boolean;
}

const HAND_CONNECTIONS: [number, number][] = [
  // Palm base
  [0, 1], [0, 5], [5, 9], [9, 13], [13, 17], [0, 17],
  // Thumb
  [1, 2], [2, 3], [3, 4],
  // Index
  [5, 6], [6, 7], [7, 8],
  // Middle
  [9, 10], [10, 11], [11, 12],
  // Ring
  [13, 14], [14, 15], [15, 16],
  // Pinky
  [17, 18], [18, 19], [19, 20]
];

export const LandmarkOverlay: React.FC<LandmarkOverlayProps> = ({
  landmarks,
  pose,
  face,
  videoRef,
  showSkeleton = true,
  showPoints = true,
  showPose = true,
  showFaceCues = true,
  highContrast = false,
  isSimulating = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const video = videoRef.current;
    const parent = canvas.parentElement;

    // Determine dimensions
    const width = (video && video.videoWidth > 0 ? video.videoWidth : parent?.clientWidth) || 640;
    const height = (video && video.videoHeight > 0 ? video.videoHeight : parent?.clientHeight) || 360;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const mapX = (x: number) => (isSimulating ? x * width : (1 - x) * width);
    const mapY = (y: number) => y * height;

    // 1. Draw Upper Body & Shoulder Pose (if available and enabled)
    if (showPose && pose && pose.leftShoulder && pose.rightShoulder) {
      const lsX = mapX(pose.leftShoulder.x);
      const lsY = mapY(pose.leftShoulder.y);
      const rsX = mapX(pose.rightShoulder.x);
      const rsY = mapY(pose.rightShoulder.y);

      // Shoulder bar
      ctx.strokeStyle = highContrast ? '#00FF00' : 'rgba(16, 185, 129, 0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(lsX, lsY);
      ctx.lineTo(rsX, rsY);
      ctx.stroke();

      // Shoulder points
      ctx.fillStyle = highContrast ? '#FFFFFF' : '#10B981';
      ctx.beginPath();
      ctx.arc(lsX, lsY, 4, 0, Math.PI * 2);
      ctx.arc(rsX, rsY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Arms to elbows / wrists if present
      if (pose.leftElbow) {
        const leX = mapX(pose.leftElbow.x);
        const leY = mapY(pose.leftElbow.y);
        ctx.beginPath();
        ctx.moveTo(lsX, lsY);
        ctx.lineTo(leX, leY);
        if (pose.leftWrist) {
          ctx.lineTo(mapX(pose.leftWrist.x), mapY(pose.leftWrist.y));
        }
        ctx.stroke();
      }
      if (pose.rightElbow) {
        const reX = mapX(pose.rightElbow.x);
        const reY = mapY(pose.rightElbow.y);
        ctx.beginPath();
        ctx.moveTo(rsX, rsY);
        ctx.lineTo(reX, reY);
        if (pose.rightWrist) {
          ctx.lineTo(mapX(pose.rightWrist.x), mapY(pose.rightWrist.y));
        }
        ctx.stroke();
      }
    }

    // 2. Draw Facial Expression & Non-Manual Marker indicators (if enabled)
    if (showFaceCues && face && pose?.nose) {
      const noseX = mapX(pose.nose.x);
      const noseY = mapY(pose.nose.y);

      // Draw subtle face focus ring
      ctx.strokeStyle = face.eyebrowsRaised
        ? '#F59E0B' // Amber for question marker
        : highContrast
        ? '#FFFF00'
        : 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(noseX, noseY, 28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label NMM if active
      if (face.eyebrowsRaised) {
        ctx.fillStyle = '#F59E0B';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('NMM: Question Marker', noseX - 45, noseY - 34);
      } else if (face.headShakeDetected) {
        ctx.fillStyle = '#EF4444';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('NMM: Negation Marker', noseX - 45, noseY - 34);
      }
    }

    // 3. Draw Hand Landmarks
    if (!landmarks || landmarks.length === 0) return;

    landmarks.forEach((hand, handIndex) => {
      const lineColor = highContrast
        ? '#FFFF00'
        : handIndex === 0
        ? '#22D3EE'
        : '#F472B6';

      const pointColor = highContrast
        ? '#FFFFFF'
        : handIndex === 0
        ? '#38BDF8'
        : '#FB7185';

      const tipColor = highContrast ? '#FF3333' : '#F59E0B';

      // Skeleton connections
      if (showSkeleton) {
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = highContrast ? 4 : 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (const [start, end] of HAND_CONNECTIONS) {
          const p1 = hand[start];
          const p2 = hand[end];
          if (!p1 || !p2) continue;

          ctx.beginPath();
          ctx.moveTo(mapX(p1.x), mapY(p1.y));
          ctx.lineTo(mapX(p2.x), mapY(p2.y));
          ctx.stroke();
        }
      }

      // 21 Landmark points
      if (showPoints) {
        const fingertipIndices = [4, 8, 12, 16, 20];

        hand.forEach((point, index) => {
          if (!point) return;
          const x = mapX(point.x);
          const y = mapY(point.y);
          const isFingertip = fingertipIndices.includes(index);
          const isWrist = index === 0;

          ctx.fillStyle = isFingertip ? tipColor : isWrist ? '#10B981' : pointColor;
          ctx.beginPath();
          ctx.arc(x, y, isFingertip ? 4.5 : 3, 0, Math.PI * 2);
          ctx.fill();

          if (!highContrast) {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      }
    });
  }, [landmarks, pose, face, videoRef, showSkeleton, showPoints, showPose, showFaceCues, highContrast, isSimulating]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none w-full h-full z-10"
      aria-hidden="true"
    />
  );
};
