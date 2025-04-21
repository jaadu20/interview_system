import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Send,
  Loader2,
  Repeat,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import aibot from "../../assets/public/images/aibot.jpg";

export function AIInterview() {
  const navigate = useNavigate();

  const [answer, setAnswer] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const staticQuestions = [
    "Tell me about yourself",
    "Why do you want this position?",
    "What are your greatest strengths?",
  ];
  const [questions, setQuestions] = useState<string[]>([...staticQuestions]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setMediaStream(stream);
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length > 0) {
          const vidStream = new MediaStream([videoTracks[0]]);
          setVideoStream(vidStream);
          setCameraEnabled(true);
        }
        if (stream.getAudioTracks().length > 0) {
          setAudioEnabled(true);
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };
    startMedia();
    playQuestionAudio(staticQuestions[0]);
  }, []);

  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
      videoRef.current
        .play()
        .catch((err) => console.error("Error playing video:", err));
    }
  }, [videoStream]);

  const toggleAudio = () => {
    if (mediaStream) {
      mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setAudioEnabled(track.enabled);
      });
    }
  };

  const toggleCamera = async () => {
    if (cameraEnabled) {
      if (videoStream) {
        videoStream.getVideoTracks().forEach((track) => track.stop());
        setVideoStream(null);
      }
      setCameraEnabled(false);
    } else {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        const videoTracks = newStream.getVideoTracks();
        if (videoTracks.length > 0) {
          const vidStream = new MediaStream([videoTracks[0]]);
          setVideoStream(vidStream);
          setCameraEnabled(true);
        }
      } catch (error) {
        console.error("Error reactivating the camera:", error);
      }
    }
  };

  const playQuestionAudio = async (questionText: string) => {
    try {
      const response = await fetch("api/azure/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: questionText }),
      });
      if (!response.ok) throw new Error("TTS service error");
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      setIsSpeaking(true);
      audio.onended = () => setIsSpeaking(false);
      audio.play();
    } catch (err) {
      console.error("TTS error:", err);
    }
  };

  useEffect(() => {
    if (questions[currentQuestionIndex]) {
      playQuestionAudio(questions[currentQuestionIndex]);
    }
  }, [currentQuestionIndex, questions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex flex-col">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6">
          <div className="w-1/3" />
          <div className="flex items-center justify-center w-1/3 gap-2 text-indigo-700">
            <div className="bg-indigo-100 p-2 rounded-full">
              <Video className="h-6 w-6 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              AI-VIS Interview
            </h1>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-6">
          <div className="relative bg-gray-200 rounded-2xl overflow-hidden shadow-xl aspect-video">
            {cameraEnabled && videoStream ? (
              <video
                ref={videoRef}
                className="object-cover w-full h-full"
                autoPlay
                muted
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                <span className="text-gray-700 text-lg">Off</span>
              </div>
            )}
            <div className="absolute top-2 right-2 flex gap-3 z-10">
              <button
                onClick={toggleCamera}
                className="bg-white p-2 rounded-full shadow hover:bg-gray-100 focus:outline-none transition-transform transform hover:scale-110"
                title="Toggle Camera"
              >
                {cameraEnabled ? (
                  <Video className="h-6 w-6 text-indigo-600" />
                ) : (
                  <VideoOff className="h-6 w-6 text-gray-600" />
                )}
              </button>
              <button
                onClick={toggleAudio}
                className="bg-white p-2 rounded-full shadow hover:bg-gray-100 focus:outline-none transition-transform transform hover:scale-110"
                title="Toggle Microphone"
              >
                {audioEnabled ? (
                  <Mic className="h-6 w-6 text-indigo-600" />
                ) : (
                  <MicOff className="h-6 w-6 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-6 relative">
            <div className="space-y-4 relative">
              <h3 className="text-xl font-semibold text-gray-800">
                {questions[currentQuestionIndex]}
              </h3>
              <div className="relative">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full h-48 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Type your answer here..."
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </section>

        <aside className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center">
            <div
              className={`mx-auto w-48 h-48 rounded-full p-1 mb-4 transition-all ${
                isSpeaking ? "animate-pulse-wave" : "border border-gray-300"
              }`}
            >
              <img
                src={aibot}
                alt="AI Interviewer"
                className="rounded-full w-full h-full object-cover"
              />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-indigo-700">
              AI Interviewer
            </h2>
            <div className="text-gray-600 text-center space-y-2">
              <p>{isSpeaking ? "Speaking... " : ""}</p>
            </div>
            <div className="mt-4 p-2 bg-indigo-50 rounded-md shadow-inner">
              <span className="text-sm text-indigo-800">
                Question {currentQuestionIndex + 1} of 15
              </span>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleRepeatQuestion}
              disabled={isLoading}
              className="w-full py-3 flex items-center justify-center bg-gray-500 hover:bg-gray-600 text-white transition-colors"
            >
              <Repeat className="h-5 w-5 mr-2" />
              Repeat
            </Button>
            <Button
              onClick={handleAnswerSubmit}
              disabled={!answer.trim() || isLoading}
              className="w-full py-3 flex items-center justify-center bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Processing...
                </>
              ) : currentQuestionIndex < 3 ? (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Submit
                </>
              ) : (
                "Complete"
              )}
            </Button>
          </div>

          <Button
            onClick={() => navigate("/complete")}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-colors shadow-xl rounded-full"
            disabled={currentQuestionIndex < 14}
          >
            Complete
          </Button>
        </aside>
      </main>
    </div>
  );
}

export default AIInterview;
