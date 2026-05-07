import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Wand2, Download, Image, Sparkles, Loader2, X, Check } from 'lucide-react';
import { image_synthesize } from './lib/mcp';

type StyleOption = 'clean' | 'artistic' | 'minimal' | 'enhanced';
type OutputFormat = 'png' | 'jpeg';

interface StyleConfig {
  name: string;
  prompt: string;
  icon: string;
}

const styleConfigs: Record<StyleOption, StyleConfig> = {
  clean: {
    name: 'Clean',
    prompt: 'Professional, clean, high-quality design, smooth edges, crisp details',
    icon: '✨',
  },
  artistic: {
    name: 'Artistic',
    prompt: 'Artistic enhancement, creative interpretation, vibrant colors, artistic flair',
    icon: '🎨',
  },
  minimal: {
    name: 'Minimal',
    prompt: 'Minimalist design, simplified elements, clean lines, essential focus',
    icon: '◇',
  },
  enhanced: {
    name: 'Enhanced',
    prompt: 'Enhanced quality, improved resolution, detailed, high fidelity',
    icon: '⬆',
  },
};

function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [recreatedImage, setRecreatedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<StyleOption>('enhanced');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('png');
  const [jpegQuality, setJpegQuality] = useState(95);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = useCallback((file: File) => {
    if (!file.type.match(/^image\/(png|jpeg|jpg|webp)$/)) {
      setError('Please upload a PNG, JPEG, or WebP image');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
      setRecreatedImage(null);
      setShowSuccess(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageUpload(file);
    }
  }, [handleImageUpload]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            handleImageUpload(file);
            break;
          }
        }
      }
    }
  }, [handleImageUpload]);

  const handleRecreate = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    setError(null);

    try {
      const base64Data = originalImage.split(',')[1];
      const blob = await fetch(`data:image/png;base64,${base64Data}`).then(r => r.blob());
      const tempPath = `/tmp/workspace_tmp/uploaded_image_${Date.now()}.png`;

      const formData = new FormData();
      formData.append('file', blob, 'image.png');

      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });

      let imagePath = tempPath;
      if (response.ok) {
        const result = await response.json();
        imagePath = result.path || tempPath;
      }

      const styleConfig = styleConfigs[selectedStyle];
      const prompt = `Recreate this image with ${styleConfig.prompt}. Maintain the composition and key elements while enhancing overall quality and visual appeal. High resolution output, smooth and clean.`;

      const result = await image_synthesize({
        display_text: 'Recreating image with AI...',
        requests: [{
          input_files: [imagePath],
          output_file: `/tmp/workspace_tmp/recreated_${Date.now()}.png`,
          prompt: prompt,
        }],
      });

      if (result && result.length > 0) {
        const outputPath = result[0].output_file;
        const fileResponse = await fetch(`/file${outputPath}`);
        if (fileResponse.ok) {
          const blob = await fileResponse.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          setRecreatedImage(dataUrl);
          setIsReady(true);
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 2000);
        } else {
          throw new Error('Failed to fetch recreated image');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recreate image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!recreatedImage) return;

    const link = document.createElement('a');
    link.href = recreatedImage;
    link.download = `recreated_${selectedStyle}_${Date.now()}.${outputFormat}`;

    if (outputFormat === 'jpeg') {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new window.Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            link.href = URL.createObjectURL(blob);
            link.download = `recreated_${selectedStyle}_${Date.now()}.jpg`;
            link.click();
          }
        }, 'image/jpeg', jpegQuality / 100);
      };
      img.src = recreatedImage;
    } else {
      link.click();
    }
  };

  const clearImage = () => {
    setOriginalImage(null);
    setRecreatedImage(null);
    setError(null);
    setIsReady(false);
  };

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  return (
    <div className="min-h-screen bg-space-bg font-space text-text-primary relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-electric-primary/10 via-transparent to-electric-secondary/10 pointer-events-none" />

      <div className="absolute top-0 left-1/4 w-96 h-96 bg-electric-primary/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-electric-secondary/20 rounded-full blur-[128px] pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-electric-primary to-electric-secondary flex items-center justify-center shadow-glow">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-electric-primary via-electric-secondary to-electric-accent bg-clip-text text-transparent">
              AI Design Recreator
            </h1>
          </div>
          <p className="text-text-secondary text-lg">
            Upload your design and let AI recreate it with enhanced quality
          </p>
        </header>

        {!originalImage ? (
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer
              transition-all duration-300 ease-out
              ${isDragging
                ? 'border-electric-primary bg-electric-primary/10 shadow-glow scale-[1.02]'
                : 'border-space-border hover:border-electric-primary/60 hover:bg-space-card/50'
              }
              animate-float
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-4">
              <div className={`
                w-24 h-24 rounded-2xl bg-gradient-to-br from-electric-primary/20 to-electric-secondary/20
                flex items-center justify-center transition-transform duration-300
                ${isDragging ? 'scale-110' : ''}
              `}>
                <Upload className={`w-12 h-12 text-electric-primary transition-all ${isDragging ? 'animate-pulse' : ''}`} />
              </div>

              <div>
                <p className="text-xl font-semibold text-text-primary mb-2">
                  Drop your image here
                </p>
                <p className="text-text-secondary">
                  or click to browse • PNG, JPEG, WebP up to 10MB
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-text-secondary mt-4">
                <kbd className="px-3 py-1 rounded-lg bg-space-card border border-space-border">
                  Ctrl+V
                </kbd>
                <span>to paste from clipboard</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="relative group">
                <div className="absolute -top-3 left-4 z-10">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-electric-primary/20 text-electric-primary border border-electric-primary/30">
                    Original
                  </span>
                </div>
                <div className="relative rounded-2xl overflow-hidden bg-space-card border border-space-border p-2">
                  <img
                    src={originalImage}
                    alt="Original"
                    className="w-full h-auto rounded-xl"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-space-bg/80 backdrop-blur flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -top-3 left-4 z-10">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-electric-accent/20 text-electric-accent border border-electric-accent/30">
                    Recreated
                  </span>
                </div>
                <div className="relative rounded-2xl overflow-hidden bg-space-card border border-space-border p-2 min-h-[200px]">
                  {recreatedImage ? (
                    <img
                      src={recreatedImage}
                      alt="Recreated"
                      className="w-full h-auto rounded-xl"
                    />
                  ) : isProcessing ? (
                    <div className="flex items-center justify-center h-full min-h-[200px]">
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <Loader2 className="w-12 h-12 text-electric-primary animate-spin" />
                          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-electric-secondary rounded-full animate-spin" style={{ animationDelay: '0.2s' }} />
                        </div>
                        <p className="text-text-secondary animate-pulse">AI is recreating your design...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full min-h-[200px]">
                      <div className="text-center text-text-secondary">
                        <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Awaiting recreation</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {showSuccess && (
              <div className="flex items-center justify-center gap-2 text-success animate-pulse">
                <Check className="w-5 h-5" />
                <span>Recreation complete!</span>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-center">
                {error}
              </div>
            )}

            <div className="bg-space-card/50 backdrop-blur-sm rounded-2xl border border-space-border p-6">
              <h3 className="text-lg font-semibold mb-4">Style Options</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {(Object.keys(styleConfigs) as StyleOption[]).map((style) => (
                  <button
                    key={style}
                    onClick={() => setSelectedStyle(style)}
                    className={`
                      relative p-4 rounded-xl border transition-all duration-300
                      ${selectedStyle === style
                        ? 'border-electric-primary bg-electric-primary/10 shadow-glow'
                        : 'border-space-border hover:border-electric-primary/50 hover:bg-space-card'
                      }
                    `}
                  >
                    <span className="text-2xl mb-2 block">{styleConfigs[style].icon}</span>
                    <span className="font-medium">{styleConfigs[style].name}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={handleRecreate}
                  disabled={isProcessing}
                  className={`
                    flex-1 min-w-[200px] py-4 px-8 rounded-xl font-semibold text-lg
                    bg-gradient-to-r from-electric-primary to-electric-secondary
                    hover:shadow-glow transition-all duration-300
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center gap-3
                  `}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      Recreate with AI
                    </>
                  )}
                </button>

                {recreatedImage && (
                  <>
                    <div className="flex items-center gap-2 bg-space-surface rounded-lg p-1">
                      <button
                        onClick={() => setOutputFormat('png')}
                        className={`
                          px-4 py-2 rounded-md font-medium transition-all
                          ${outputFormat === 'png'
                            ? 'bg-electric-primary text-white shadow-glow'
                            : 'hover:bg-space-card'
                          }
                        `}
                      >
                        PNG
                      </button>
                      <button
                        onClick={() => setOutputFormat('jpeg')}
                        className={`
                          px-4 py-2 rounded-md font-medium transition-all
                          ${outputFormat === 'jpeg'
                            ? 'bg-electric-primary text-white shadow-glow'
                            : 'hover:bg-space-card'
                          }
                        `}
                      >
                        JPEG
                      </button>
                    </div>

                    {outputFormat === 'jpeg' && (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-text-secondary">Quality:</span>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={jpegQuality}
                          onChange={(e) => setJpegQuality(Number(e.target.value))}
                          className="w-24 accent-electric-primary"
                        />
                        <span className="text-sm font-mono text-electric-accent w-10">{jpegQuality}%</span>
                      </div>
                    )}

                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 py-4 px-6 rounded-xl font-semibold bg-success hover:bg-success/80 transition-colors"
                    >
                      <Download className="w-5 h-5" />
                      Download
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={clearImage}
                className="text-text-secondary hover:text-electric-primary transition-colors"
              >
                Upload a different image
              </button>
            </div>
          </div>
        )}

        <footer className="text-center mt-16 text-text-secondary text-sm">
          <p>Supports drag & drop, paste, or file picker • Max 10MB</p>
        </footer>
      </div>
    </div>
  );
}

export default App;