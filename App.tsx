import React, { useState, useCallback, useRef } from 'react';
import { FunctionType, FunctionParams, Point, COLORS } from './types';
import Button3D from './components/Button3D';
import ValueTable from './components/ValueTable';
import GraphPlot from './components/GraphPlot';
import { generateDocx } from './services/docxService';
import { TrendingUp, Divide, Activity, RotateCcw, Download, Home } from 'lucide-react';

function App() {
  // --- State ---
  const [step, setStep] = useState<'MENU' | 'INPUT' | 'RESULT'>('MENU');
  const [funcType, setFuncType] = useState<FunctionType | null>(null);
  
  // Inputs (Text to allow fractions)
  const [a, setA] = useState<string>('');
  const [b, setB] = useState<string>('');
  
  // X inputs for calculation
  const [inputX1, setInputX1] = useState<string>('1');
  const [inputX2, setInputX2] = useState<string>('2');
  
  // Results
  const [points, setPoints] = useState<Point[]>([]);
  const [parsedParams, setParsedParams] = useState<FunctionParams>({ a: 1, b: 0 });

  const graphRef = useRef<SVGSVGElement | null>(null);

  // --- Helpers ---

  // Helper to parse inputs that might be fractions (e.g. "1/2", "-3/4")
  const parseInput = (val: string): number => {
    if (!val) return NaN;
    const v = val.trim();
    if (v.includes('/')) {
      const parts = v.split('/');
      if (parts.length === 2) {
        const num = parseFloat(parts[0]);
        const den = parseFloat(parts[1]);
        if (!isNaN(num) && !isNaN(den) && den !== 0) {
          return num / den;
        }
      }
      return NaN;
    }
    return parseFloat(v);
  };

  // --- Handlers ---

  const selectFunction = (type: FunctionType) => {
    setFuncType(type);
    setStep('INPUT');
    // Reset inputs
    setA('');
    setB('');
    // Default values
    setInputX1('1'); 
    setInputX2('2');
  };

  const handleCalculate = () => {
    const valA = parseInput(a);
    const valB = parseInput(b);
    const x1 = parseInput(inputX1);
    const x2 = parseInput(inputX2);

    if (isNaN(valA)) {
      alert("Vui lòng nhập hệ số a hợp lệ (số thập phân hoặc phân số, vd: 1/2)");
      return;
    }

    // Logic to generate points based on function type
    let calculatedPoints: Point[] = [];
    const pParams = { a: valA, b: isNaN(valB) ? 0 : valB };
    setParsedParams(pParams);

    const calcY = (x: number) => {
      if (funcType === FunctionType.LinearOrigin) return valA * x;
      if (funcType === FunctionType.LinearAffine) return valA * x + (isNaN(valB) ? 0 : valB);
      if (funcType === FunctionType.Quadratic) return valA * x * x;
      return 0;
    };

    if (funcType === FunctionType.LinearOrigin) {
        // y = ax
        // Requirement: Default (0,0) and user inputs x1
        if (isNaN(x1)) {
            alert("Vui lòng nhập giá trị x hợp lệ");
            return;
        }
        calculatedPoints = [
            { x: 0, y: 0 },
            { x: x1, y: calcY(x1) }
        ];
    } else if (funcType === FunctionType.LinearAffine) {
        // y = ax + b
        // Requirement: No default (0,0), user inputs x1 and x2
        if (isNaN(valB)) {
            alert("Vui lòng nhập hệ số b hợp lệ");
            return;
        }
        if (isNaN(x1) || isNaN(x2)) {
            alert("Vui lòng nhập đầy đủ giá trị x1 và x2");
            return;
        }
        if (x1 === x2) {
             alert("Vui lòng nhập hai giá trị x khác nhau");
             return;
        }
        calculatedPoints = [
            { x: x1, y: calcY(x1) },
            { x: x2, y: calcY(x2) }
        ];
        // Sort by x for better table reading
        calculatedPoints.sort((p1, p2) => p1.x - p2.x);

    } else if (funcType === FunctionType.Quadratic) {
        // y = ax²
        // Requirement: Only input 'a', auto generate x values
        // Standard points for plotting parabola: -2, -1, 0, 1, 2
        const xValues = [-2, -1, 0, 1, 2];
        calculatedPoints = xValues.map(x => ({ x, y: calcY(x) }));
    }

    setPoints(calculatedPoints);
    setStep('RESULT');
  };

  const handleReset = () => {
    setStep('MENU');
    setFuncType(null);
    setPoints([]);
  };

  const handleBackToInput = () => {
    setStep('INPUT');
  };

  const handleDownload = async () => {
    if (!graphRef.current || !funcType) return;
    
    try {
      // We need to capture the SVG. Using html-to-image on the parent div or converting SVG string to blob.
      // Since SVG is a DOM node, we can serialize it.
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(graphRef.current);
      const svgBlob = new Blob([svgString], {type: "image/svg+xml;charset=utf-8"});
      const url = URL.createObjectURL(svgBlob);
      
      // Convert SVG blob URL to PNG Data URL using Canvas for DOCX compatibility
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if(ctx) {
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const pngDataUrl = canvas.toDataURL("image/png");
            generateDocx(funcType, parsedParams, points, pngDataUrl);
            URL.revokeObjectURL(url);
        }
      };
      img.src = url;

    } catch (error) {
      console.error("Export failed", error);
      alert("Có lỗi khi tạo file. Vui lòng thử lại.");
    }
  };

  // --- Helper to get label string ---
  const getLabelString = () => {
    if (!funcType) return 'y';
    if (funcType === FunctionType.LinearOrigin) return `y = ${parsedParams.a}x`;
    if (funcType === FunctionType.LinearAffine) {
        const bSign = parsedParams.b >= 0 ? '+' : '';
        return `y = ${parsedParams.a}x ${bSign} ${parsedParams.b}`;
    }
    if (funcType === FunctionType.Quadratic) return `y = ${parsedParams.a}x²`;
    return 'y';
  };

  // --- Renders ---

  const renderMenu = () => (
    <div className="flex flex-col gap-6 w-full max-w-sm mx-auto">
      <Button3D onClick={() => selectFunction(FunctionType.LinearOrigin)} color="red" fullWidth>
        <div className="flex items-center justify-center gap-3">
          <TrendingUp size={24} />
          <span>Hàm số y = ax</span>
        </div>
      </Button3D>
      
      <Button3D onClick={() => selectFunction(FunctionType.LinearAffine)} color="green" fullWidth>
        <div className="flex items-center justify-center gap-3">
          <Divide size={24} />
          <span>Hàm số y = ax + b</span>
        </div>
      </Button3D>
      
      <Button3D onClick={() => selectFunction(FunctionType.Quadratic)} color="gold" fullWidth>
        <div className="flex items-center justify-center gap-3">
          <Activity size={24} />
          <span>Hàm số y = ax²</span>
        </div>
      </Button3D>
    </div>
  );

  const renderInput = () => (
    <div className="w-full max-w-md mx-auto bg-white/50 p-6 rounded-xl border-2 border-[#8B5A2B] shadow-inner">
      <h3 className="text-xl font-bold text-[#8B5A2B] text-center mb-6 uppercase border-b-2 border-[#8B5A2B] pb-2">
        {funcType === FunctionType.LinearOrigin && 'Nhập liệu y = ax'}
        {funcType === FunctionType.LinearAffine && 'Nhập liệu y = ax + b'}
        {funcType === FunctionType.Quadratic && 'Nhập liệu y = ax²'}
      </h3>

      <div className="space-y-4">
        {/* Param A */}
        <div className="flex items-center gap-4">
          <label className="w-24 font-bold text-[#8B5A2B]">Hệ số a =</label>
          <input 
            type="text" 
            inputMode="text"
            value={a} 
            onChange={e => setA(e.target.value)}
            className="flex-1 p-2 border-2 border-[#8B5A2B] rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
            placeholder="Nhập a (vd: 2 hoặc 1/2)"
          />
        </div>

        {/* Param B (Only for ax+b) */}
        {funcType === FunctionType.LinearAffine && (
          <div className="flex items-center gap-4">
            <label className="w-24 font-bold text-[#8B5A2B]">Hệ số b =</label>
            <input 
              type="text" 
              inputMode="text"
              value={b} 
              onChange={e => setB(e.target.value)}
              className="flex-1 p-2 border-2 border-[#8B5A2B] rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
              placeholder="Nhập b (vd: 3 hoặc -1.5)"
            />
          </div>
        )}

        {/* X Inputs - Conditional based on Function Type */}
        {funcType !== FunctionType.Quadratic && (
            <div className="pt-4 border-t border-dashed border-[#8B5A2B]">
                <p className="text-sm italic text-gray-600 mb-2 text-center">
                    {funcType === FunctionType.LinearOrigin 
                        ? 'Nhập một giá trị x (Ngoài điểm O(0,0) mặc định)' 
                        : 'Chọn hai giá trị x để vẽ đồ thị'}
                </p>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-[#8B5A2B] mb-1">
                            {funcType === FunctionType.LinearAffine ? 'Giá trị x₁' : 'Giá trị x'}
                        </label>
                        <input 
                            type="text" 
                            inputMode="text"
                            value={inputX1} 
                            onChange={e => setInputX1(e.target.value)}
                            className="w-full p-2 border border-[#8B5A2B] rounded shadow-sm text-center"
                            placeholder="vd: 1"
                        />
                    </div>
                    {/* Only show second X input for y = ax + b */}
                    {funcType === FunctionType.LinearAffine && (
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-[#8B5A2B] mb-1">Giá trị x₂</label>
                            <input 
                                type="text" 
                                inputMode="text"
                                value={inputX2} 
                                onChange={e => setInputX2(e.target.value)}
                                className="w-full p-2 border border-[#8B5A2B] rounded shadow-sm text-center"
                                placeholder="vd: 2"
                            />
                        </div>
                    )}
                </div>
            </div>
        )}

        {funcType === FunctionType.Quadratic && (
             <div className="pt-4 border-t border-dashed border-[#8B5A2B]">
                <p className="text-sm italic text-[#8B5A2B] text-center font-medium bg-[#8B5A2B]/10 p-2 rounded">
                   Hệ thống sẽ tự động lấy các điểm chuẩn: -2; -1; 0; 1; 2
                </p>
             </div>
        )}

        <div className="flex gap-4 mt-8">
          <Button3D onClick={handleCalculate} color="red" fullWidth>
            <span className="text-sm">Thực hiện</span>
          </Button3D>
          <Button3D onClick={handleReset} color="gold" fullWidth>
            <div className="flex items-center justify-center gap-2">
              <RotateCcw size={18} />
              <span className="text-sm">Quay lại</span>
            </div>
          </Button3D>
        </div>
      </div>
    </div>
  );

  const renderResult = () => (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center animate-fade-in-up">
       {/* Actions Bar */}
       <div className="flex gap-2 mb-4 w-full justify-between">
          <button 
            onClick={handleBackToInput}
            className="bg-[#8B5A2B] text-white px-3 py-1 rounded shadow hover:bg-[#6b4420] text-sm flex items-center gap-1"
          >
            <RotateCcw size={14}/> Sửa số liệu
          </button>
          <button 
            onClick={handleReset}
            className="bg-gray-600 text-white px-3 py-1 rounded shadow hover:bg-gray-700 text-sm flex items-center gap-1"
          >
            <Home size={14}/> Trang chủ
          </button>
       </div>

      <ValueTable points={points} yLabel={getLabelString()} />
      
      <div className="relative w-full bg-white rounded-lg shadow-xl p-4 border-4 border-[#FFD700]">
        {funcType && <GraphPlot 
          funcType={funcType} 
          params={parsedParams} 
          points={points} 
          onMount={(svg) => graphRef.current = svg}
        />}
      </div>

      <div className="mt-8 w-full max-w-xs">
        <Button3D onClick={handleDownload} color="blue" fullWidth>
          <div className="flex items-center justify-center gap-2">
            <Download size={20} />
            <span>Tải về file Word</span>
          </div>
        </Button3D>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDF5E6] flex flex-col font-sans">
      {/* 3D Header */}
      <header className="bg-[#8B5A2B] text-[#FFD700] p-4 text-center shadow-[0_4px_0_#5D3A1A] mb-8 sticky top-0 z-50">
        <h1 className="text-2xl md:text-3xl font-black tracking-widest uppercase drop-shadow-md">
          GraphToán THCS
        </h1>
        <p className="text-white text-xs md:text-sm mt-1 opacity-90">Ứng dụng hỗ trợ học tập môn Toán</p>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 pb-20">
        <div className="bg-[#FFF8DC] border-4 border-[#8B5A2B] rounded-2xl shadow-[8px_8px_0_rgba(139,90,43,0.3)] p-6 md:p-8 min-h-[400px]">
          {step === 'MENU' && renderMenu()}
          {step === 'INPUT' && renderInput()}
          {step === 'RESULT' && renderResult()}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#2a1b0e] text-center p-4 border-t-4 border-[#FFD700]">
        <div className="max-w-md mx-auto space-y-2">
          <p className="text-[#FF4444] font-bold text-sm bg-black/20 p-2 rounded border border-[#FF4444]/30">
            ⚠️ Nội dung mang tính tham khảo, Thầy (Cô) nên đọc lại trước khi sử dụng.
          </p>
          <p className="text-[#FFD700] font-medium text-sm animate-pulse">
            ✨ Thầy Long cảm ơn các bạn đã tin dùng!!! ✨
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;