import { useState, useEffect } from 'react';

export default function MRRenderStudio() {
  const [images, setImages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [customPresets, setCustomPresets] = useState([]);
  const [presetName, setPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  // Load history and custom presets from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mr-history');
      if (saved) setHistory(JSON.parse(saved));
      const presets = localStorage.getItem('mr-custom-presets');
      if (presets) setCustomPresets(JSON.parse(presets));
    } catch {}
  }, []);

  // Save history to localStorage
  const saveHistory = (newHistory) => {
    setHistory(newHistory);
    try { localStorage.setItem('mr-history', JSON.stringify(newHistory)); } catch {}
  };

  // Save custom presets to localStorage
  const saveCustomPresets = (newPresets) => {
    setCustomPresets(newPresets);
    try { localStorage.setItem('mr-custom-presets', JSON.stringify(newPresets)); } catch {}
  };

  const addImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImages(prev => [...prev, { id: Date.now(), data: ev.target.result }]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const deleteImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const clearAll = () => {
    setImages([]);
    setPrompt('');
    setResult(null);
    setError(null);
  };

  const generate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          image_urls: images.map(img => img.data),
          aspect_ratio: 'auto',
          output_format: 'png',
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.images?.[0]?.url) {
        setResult(data.images[0].url);
        // Add to history
        const entry = {
          id: Date.now(),
          url: data.images[0].url,
          prompt: prompt,
          date: new Date().toLocaleString(),
        };
        saveHistory([entry, ...history].slice(0, 50));
      } else {
        setError('No image returned from API');
      }
    } catch (err) {
      console.error('Generate error:', err);
      setError(err.message || 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  };

  const download = async () => {
    if (!result) return;

    try {
      const response = await fetch(result);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `mr-render-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (err) {
      window.open(result, '_blank');
    }
  };

  const useAsInput = async () => {
    if (!result) return;

    try {
      const response = await fetch(result);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImages([{ id: Date.now(), data: ev.target.result }]);
        setResult(null);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      setError('Could not load result as input. Try downloading and re-uploading.');
    }
  };

  const contextPrompts = {
    hotel: 'Take exact image but put it in luxury hotel lobby. Editorial architecture photography, Canon 5D 35mm, shallow depth of field f/2.8, warm ambient lighting, guests in soft focus background, marble floors with reflections. Real not rendered.',
    hospital: 'Take exact image but put it in hospital atrium lobby. Editorial architecture photography, Canon 5D 35mm, shallow depth of field f/2.8, natural daylight from skylights, healthcare staff in soft focus, polished floors. Real not rendered.',
    corporate: 'Take exact image but put it in corporate headquarters lobby. Editorial architecture photography, Canon 5D 35mm, shallow depth of field f/2.8, dramatic lighting, professionals in soft focus background, stone floor reflections. Real not rendered.',
    museum: 'Take exact image but put it in museum gallery. Editorial architecture photography, Canon 5D 35mm, shallow depth of field f/2.8, soft diffused lighting, visitors in soft focus, polished concrete floor. Real not rendered.',
    spa: 'Take exact image but put it in luxury spa wellness center. Editorial architecture photography, Canon 5D 35mm, shallow depth of field f/2.8, warm ambient lighting, zen atmosphere, natural materials. Real not rendered.',
    airport: 'Take exact image but put it in airport terminal. Editorial architecture photography, Canon 5D 35mm, shallow depth of field f/2.8, bright natural daylight, travelers in soft focus, terrazzo floors. Real not rendered.',
  };

  const materialPresets = {
    wood: 'Material is warm natural wood with visible grain texture and matte finish.',
    stone: 'Material is natural stone with subtle veining and polished surface.',
    metal: 'Material is brushed metal with soft reflections and industrial finish.',
    concrete: 'Material is raw concrete with visible aggregate texture and matte surface.',
    terrazzo: 'Material is terrazzo with colorful stone chips in polished cement base.',
  };

  const addToPrompt = (text) => {
    setPrompt(prev => prev ? `${prev} ${text}` : text);
  };

  const savePreset = () => {
    if (!presetName.trim() || !prompt.trim()) return;
    const newPreset = { name: presetName.trim(), prompt: prompt };
    saveCustomPresets([...customPresets, newPreset]);
    setPresetName('');
    setShowSavePreset(false);
  };

  const deletePreset = (index) => {
    saveCustomPresets(customPresets.filter((_, i) => i !== index));
  };

  const deleteHistoryItem = (id) => {
    saveHistory(history.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    saveHistory([]);
  };

  return (
    <div className="min-h-screen bg-zinc-800 text-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">MR Render Studio <span className="text-zinc-400 font-normal text-base">April 1</span></h1>
            <p className="text-zinc-500 text-sm">Renders &rarr; Real Visualizations</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={clearAll}
              className="text-zinc-500 hover:text-white text-sm transition-colors"
            >
              Clear All
            </button>
            <span className="text-zinc-700 text-xs hidden md:block">FAL Nano Banana &bull; $0.15/img</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* LEFT COLUMN - INPUTS */}
          <div className="space-y-5">

            {/* IMAGE UPLOAD */}
            <div className="bg-zinc-900 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium text-sm">Reference Images ({images.length}/5)</span>
                {images.length < 5 && (
                  <label className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg cursor-pointer text-sm font-medium transition-colors">
                    + Add
                    <input type="file" accept="image/*" onChange={addImage} className="hidden" />
                  </label>
                )}
              </div>

              {images.length === 0 ? (
                <label className="block border-2 border-dashed border-zinc-700 rounded-xl p-10 text-center cursor-pointer hover:border-zinc-500 transition-colors">
                  <div className="text-3xl mb-2">&#128444;</div>
                  <div className="text-zinc-500 text-sm">Click to upload render</div>
                  <input type="file" accept="image/*" onChange={addImage} className="hidden" />
                </label>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {images.map((img) => (
                    <div key={img.id} className="relative">
                      <img src={img.data} className="w-full aspect-video object-cover rounded-lg" />
                      <button
                        onClick={() => deleteImage(img.id)}
                        className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-400 w-7 h-7 rounded-full text-white text-lg flex items-center justify-center transition-colors"
                      >&times;</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PROMPT */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-zinc-400">Prompt</label>
                {prompt.trim() && (
                  <button
                    onClick={() => setShowSavePreset(!showSavePreset)}
                    className="text-xs text-zinc-500 hover:text-white transition-colors"
                  >
                    {showSavePreset ? 'Cancel' : 'Save as Preset'}
                  </button>
                )}
              </div>
              {showSavePreset && (
                <div className="flex gap-2 mb-2">
                  <input
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Preset name..."
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && savePreset()}
                  />
                  <button
                    onClick={savePreset}
                    className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >Save</button>
                </div>
              )}
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the context and style you want..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm h-24 focus:border-zinc-600 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* CONTEXT PRESETS */}
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Context Presets</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(contextPrompts).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setPrompt(value)}
                    className="bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-sm capitalize transition-colors"
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            {/* CUSTOM PRESETS */}
            {customPresets.length > 0 && (
              <div>
                <label className="text-sm text-zinc-400 block mb-2">My Presets</label>
                <div className="flex flex-wrap gap-2">
                  {customPresets.map((preset, i) => (
                    <div key={i} className="group relative">
                      <button
                        onClick={() => setPrompt(preset.prompt)}
                        className="bg-zinc-800 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-sm transition-colors"
                      >
                        {preset.name}
                      </button>
                      <button
                        onClick={() => deletePreset(i)}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-400 w-4 h-4 rounded-full text-white text-[10px] items-center justify-center transition-colors hidden group-hover:flex"
                      >&times;</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MATERIAL PRESETS */}
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Material (append to prompt)</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(materialPresets).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => addToPrompt(value)}
                    className="bg-zinc-800 hover:bg-teal-700 px-3 py-1.5 rounded-lg text-sm capitalize transition-colors"
                  >
                    + {key}
                  </button>
                ))}
              </div>
            </div>

            {/* ADJUSTMENTS */}
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Adjustments (append to prompt)</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => addToPrompt('Wall should be bright white, not gray.')}
                  className="bg-zinc-800 hover:bg-amber-700 px-3 py-1.5 rounded-lg text-sm transition-colors"
                >+ Bright white</button>
                <button
                  onClick={() => addToPrompt('Wall is backlit with warm golden LED glow from behind.')}
                  className="bg-zinc-800 hover:bg-amber-700 px-3 py-1.5 rounded-lg text-sm transition-colors"
                >+ Backlit</button>
                <button
                  onClick={() => addToPrompt('15 degree angled composition showing texture depth.')}
                  className="bg-zinc-800 hover:bg-amber-700 px-3 py-1.5 rounded-lg text-sm transition-colors"
                >+ Angled</button>
                <button
                  onClick={() => addToPrompt('Black concrete material with visible aggregate texture.')}
                  className="bg-zinc-800 hover:bg-amber-700 px-3 py-1.5 rounded-lg text-sm transition-colors"
                >+ Black concrete</button>
              </div>
            </div>

            {/* GENERATE */}
            <button
              onClick={generate}
              disabled={images.length === 0 || !prompt.trim() || loading}
              className="w-full bg-green-600 hover:bg-green-500 disabled:bg-zinc-800 disabled:opacity-50 py-3.5 rounded-xl font-bold text-base transition-colors"
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>

            {error && (
              <div className="bg-red-900/50 border border-red-800 rounded-lg p-3 text-sm text-red-300">
                {error}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - RESULT */}
          <div className="space-y-4">
            <div className="bg-zinc-900 rounded-xl aspect-square flex items-center justify-center overflow-hidden">
              {loading ? (
                <div className="text-center">
                  <div className="w-10 h-10 border-4 border-zinc-700 border-t-green-500 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-zinc-500 text-sm">Generating...</p>
                </div>
              ) : result ? (
                <img src={result} className="w-full h-full object-contain" alt="Generated result" />
              ) : (
                <div className="text-center text-zinc-600">
                  <div className="text-3xl mb-2">&#10024;</div>
                  <p className="text-sm">Result appears here</p>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-3">
              <button
                onClick={download}
                disabled={!result}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:opacity-40 py-2.5 rounded-xl font-medium text-sm transition-colors"
              >
                &#11015; Download
              </button>
              <button
                onClick={useAsInput}
                disabled={!result}
                className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:opacity-40 py-2.5 rounded-xl font-medium text-sm transition-colors"
              >
                &#8635; Use as Input
              </button>
            </div>

            {/* INSTRUCTIONS */}
            <div className="bg-zinc-900/50 rounded-xl p-4 text-sm text-zinc-500">
              <h3 className="font-medium text-zinc-400 mb-2">Workflow</h3>
              <ol className="space-y-1 list-decimal list-inside text-xs">
                <li>Upload your 3D render</li>
                <li>Pick a context preset or write your own</li>
                <li>Add material &amp; adjustments as needed</li>
                <li>Generate &rarr; iterate with &quot;Use as Input&quot;</li>
              </ol>
            </div>

            {/* GALLERY / HISTORY */}
            {history.length > 0 && (
              <div className="bg-zinc-900 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium text-sm">History ({history.length})</span>
                  <button
                    onClick={clearHistory}
                    className="text-zinc-500 hover:text-red-400 text-xs transition-colors"
                  >Clear</button>
                </div>
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {history.map((item) => (
                    <div key={item.id} className="group relative cursor-pointer" onClick={() => setResult(item.url)}>
                      <img
                        src={item.url}
                        className="w-full aspect-square object-cover rounded-lg hover:ring-2 hover:ring-blue-500 transition-all"
                        alt=""
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.id); }}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-400 w-4 h-4 rounded-full text-white text-[10px] items-center justify-center transition-colors hidden group-hover:flex"
                      >&times;</button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 rounded-b-lg px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] text-zinc-300 truncate">{item.prompt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
