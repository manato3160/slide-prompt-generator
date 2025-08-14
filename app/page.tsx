"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Sparkles, Presentation, Palette, Type, Users, Target, FileText, Hash } from "lucide-react"

interface FormData {
  slideTheme: string; audience: string; purpose: string; keyMessage: string; slideCount: number;
  designStyle: string; tone: string; fontStyle: string; mainColor: string; subColor: string;
}

const colorOptions = [
    { value: "#2563eb", name: "ブルー" }, { value: "#93c5fd", name: "ライトブルー" },
    { value: "#16a34a", name: "グリーン" }, { value: "#86efac", name: "ライトグリーン" },
    { value: "#dc2626", name: "レッド" }, { value: "#fca5a5", name: "ライトレッド" },
    { value: "#9333ea", name: "パープル" }, { value: "#c4b5fd", name: "ライトパープル" },
    { value: "#ea580c", name: "オレンジ" }, { value: "#fdba74", name: "ライトオレンジ" },
    { value: "#374151", name: "グレー" }, { value: "#d1d5db", name: "ライトグレー" },
    { value: "#000000", name: "ブラック" }, { value: "#ffffff", name: "ホワイト" }
];

const initialFormData: FormData = {
    slideTheme: "", audience: "", purpose: "", keyMessage: "", slideCount: 10,
    designStyle: "", tone: "", fontStyle: "", mainColor: "", subColor: ""
};

export default function SlidePromptGenerator() {
  const styleToneImageMap = useMemo(() => ({
    "シンプル": {
      "フォーマル": "/simple-formal.png",
      "カジュアル": "/simple-casual.png",
      "エネルギッシュ": "/simple-energetic.png",
      "エレガント": "/simple-elegant.png",
    },
    "モダン": {
      "フォーマル": "/modern-formal.png",
      "カジュアル": "/modern-casual.png",
      "エネルギッシュ": "/modern-energetic.png",
      "エレガント": "/modern-elegant.png",
    },
    "ビジネス": {
      "フォーマル": "/business-formal.png",
      "カジュアル": "/business-casual.png",
      "エネルギッシュ": "/business-energetic.png",
      "エレガント": "/business-elegant.png",
    },
    "クリエイティブ": {
      "フォーマル": "/creative-formal.png",
      "カジュアル": "/creative-casual.png",
      "エネルギッシュ": "/creative-energetic.png",
      "エレガント": "/creative-elegant.png",
    },
  }), []);

  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showModification, setShowModification] = useState(false)
  const [modificationRequest, setModificationRequest] = useState("")
  const [isModifying, setIsModifying] = useState(false)
  const [errorDetails, setErrorDetails] = useState("");
  const [conversationId, setConversationId] = useState("");

  useEffect(() => {
    const { designStyle, tone } = formData;
    if (designStyle && tone) {
      const style = designStyle as keyof typeof styleToneImageMap;
      if (styleToneImageMap[style] && styleToneImageMap[style][tone as keyof typeof styleToneImageMap[typeof style]]) {
        setPreviewImageUrl(styleToneImageMap[style][tone as keyof typeof styleToneImageMap[typeof style]]);
      } else {
        setPreviewImageUrl("");
      }
    } else {
      setPreviewImageUrl("");
    }
  }, [formData.designStyle, formData.tone, styleToneImageMap]);

  const steps = [
    { title: "テーマ設定", icon: Presentation }, { title: "対象・目的", icon: Target },
    { title: "デザイン", icon: Palette }, { title: "完成", icon: Sparkles }
  ];

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    console.log('handleInputChange called:', { field, value, type: typeof value });
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      console.log('New form data:', newData);
      return newData;
    });
  };

  const handleCopy = async () => {
    if (!generatedPrompt) return;
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      toast({
        description: "コピーしました！",
      });
    } catch (e) {
      toast({
        description: "コピーに失敗しました",
        variant: "destructive",
      });
    }
  };

  const callGenerateApi = async (payload: any) => {
    setErrorDetails("");
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        const errorInfo = data.details ? (typeof data.details === 'string' ? JSON.parse(data.details) : data.details) : data;
        throw new Error(errorInfo.message || JSON.stringify(errorInfo));
      }
      setGeneratedPrompt(data.answer);
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }
      setCurrentStep(3);
    } catch (error: any) {
      setErrorDetails(error.message || "不明なエラーが発生しました。");
      setGeneratedPrompt("");
      setCurrentStep(3);
    }
  }

  const generatePrompt = async () => {
    setIsGenerating(true);
    await callGenerateApi({ ...formData, query: "プロンプト生成" });
    setIsGenerating(false);
  };

  const modifyPrompt = async () => {
    setIsModifying(true);
    const payload = { ...formData, query: `以下の指示に基づいて、プロンプトを修正してください。\n\n${modificationRequest}`, conversation_id: conversationId };
    await callGenerateApi(payload);
    setIsModifying(false);
    setShowModification(false);
    setModificationRequest("");
  };

  const resetAll = () => {
    setCurrentStep(0);
    setFormData(initialFormData);
    setGeneratedPrompt("");
    setShowModification(false);
    setModificationRequest("");
    setErrorDetails("");
    setConversationId("");
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: return (
          <div className="space-y-6">
            <div className="text-center space-y-2"><Presentation className="w-12 h-12 mx-auto text-purple-500" /><h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">スライドのテーマを設定</h2><p className="text-gray-600">まずは基本的な情報を入力してください</p></div>
            <div className="space-y-4">
                <div><Label htmlFor="slideTheme" className="text-sm font-medium flex items-center gap-2"><FileText className="w-4 h-4" />スライド全体のテーマ</Label><Input id="slideTheme" placeholder="例: 新商品の紹介、プロジェクト報告など" value={formData.slideTheme} onChange={(e) => handleInputChange("slideTheme", e.target.value)} className="mt-1" /></div>
                <div><Label htmlFor="slideCount" className="text-sm font-medium flex items-center gap-2"><Hash className="w-4 h-4" />スライド枚数</Label><Input id="slideCount" type="number" min="1" max="50" value={formData.slideCount} onChange={(e) => handleInputChange("slideCount", Number.parseInt(e.target.value) || 10)} className="mt-1" /></div>
            </div>
          </div>
      );
      case 1: return (
        <div className="space-y-6">
          <div className="text-center space-y-2"><Target className="w-12 h-12 mx-auto text-blue-500" /><h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">対象者と目的を設定</h2><p className="text-gray-600">誰に向けて、何のための資料かを明確にしましょう</p></div>
          <div className="space-y-4">
              <div><Label htmlFor="audience" className="text-sm font-medium flex items-center gap-2"><Users className="w-4 h-4" />誰に向けての資料ですか？</Label><Input id="audience" placeholder="例: クライアント、社内メンバー、投資家など" value={formData.audience} onChange={(e) => handleInputChange("audience", e.target.value)} className="mt-1" /></div>
              <div><Label htmlFor="purpose" className="text-sm font-medium">資料の目的は何ですか？</Label><Textarea id="purpose" placeholder="例: 新商品の魅力を伝える、プロジェクトの進捗を報告する、予算承認を得るなど" value={formData.purpose} onChange={(e) => handleInputChange("purpose", e.target.value)} className="mt-1" rows={3}/></div>
              <div><Label htmlFor="keyMessage" className="text-sm font-medium">最も伝えたいポイントは？</Label><Textarea id="keyMessage" placeholder="例: この商品は従来品より30%効率的で、コストも20%削減できます" value={formData.keyMessage} onChange={(e) => handleInputChange("keyMessage", e.target.value)} className="mt-1" rows={3}/></div>
          </div>
        </div>
      );
      case 2: return (
          <div className="space-y-6">
            <div className="text-center space-y-2"><Palette className="w-12 h-12 mx-auto text-green-500" /><h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">デザインを設定</h2><p className="text-gray-600">スライドの見た目とスタイルを決めましょう</p></div>
            <div className="grid grid-cols-2 gap-6">
              <div><Label className="text-sm font-medium">デザインスタイル</Label><Select value={formData.designStyle} onValueChange={(value) => handleInputChange("designStyle", value)}><SelectTrigger className="mt-1"><SelectValue placeholder="スタイルを選択" /></SelectTrigger><SelectContent><SelectItem value="シンプル">シンプル</SelectItem> <SelectItem value="モダン">モダン</SelectItem><SelectItem value="ビジネス">ビジネス</SelectItem> <SelectItem value="クリエイティブ">クリエイティブ</SelectItem></SelectContent></Select></div>
              <div><Label className="text-sm font-medium">トーン</Label><Select value={formData.tone} onValueChange={(value) => handleInputChange("tone", value)}><SelectTrigger className="mt-1"><SelectValue placeholder="トーンを選択" /></SelectTrigger><SelectContent><SelectItem value="フォーマル">フォーマル</SelectItem> <SelectItem value="カジュアル">カジュアル</SelectItem><SelectItem value="エネルギッシュ">エネルギッシュ</SelectItem> <SelectItem value="エレガント">エレガント</SelectItem></SelectContent></Select></div>
            </div>
            <div className="mt-6">
              <Label className="text-sm font-medium">プレビュー <span className="text-xs text-gray-500 font-normal">※あくまでイメージ画像なので、実際の生成結果と異なる場合があります。</span></Label>
              <div className="mx-auto" style={{ maxWidth: '600px', width: '100%' }}>
                <div className="h-80 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 mt-2">
                  {previewImageUrl ? (
                    <img src={previewImageUrl} alt="デザインプレビュー" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <p className="text-gray-500 text-sm px-4 text-center">スタイルとトーンを選択するとプレビューが表示されます</p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Label className="text-sm font-medium flex items-center gap-2"><Type className="w-4 h-4" />フォント <span className="text-xs text-gray-500 font-normal">※使用するスライド生成ツールにより、フォントにばらつきが生じる可能性があります。</span></Label>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-6 mt-2">
                {[
                  { label: "メイリオ", value: "メイリオ", style: { fontFamily: "Meiryo, メイリオ, sans-serif" } },
                  { label: "Meiryo UI", value: "Meiryo UI", style: { fontFamily: "Meiryo UI, sans-serif" } },
                  { label: "遊ゴシック", value: "遊ゴシック", style: { fontFamily: "'Yu Gothic', '游ゴシック', YuGothic, sans-serif" } },
                  { label: "Yu Gothic UI", value: "Yu Gothic UI", style: { fontFamily: "Yu Gothic UI, sans-serif" } },
                ].map(font => (
                  <button
                    key={font.value}
                    type="button"
                    onClick={() => handleInputChange("fontStyle", font.value)}
                    className={`border-2 rounded-lg w-full p-4 flex flex-col items-center transition-all ${formData.fontStyle === font.value ? "border-gray-800 shadow-lg" : "border-gray-300"} hover:border-purple-400 bg-white`}
                  >
                    <span style={{ ...font.style, fontSize: "2.5rem", lineHeight: "1" }}>あア亜</span>
                    <span className="mt-2 text-sm text-gray-700">{font.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4 pt-4">
                <div><Label className="text-sm font-medium">メインカラー</Label><div className="grid grid-cols-7 gap-2 mt-2">{colorOptions.map((color) => (<button key={color.value} onClick={() => handleInputChange("mainColor", color.value)} className={`w-10 h-10 rounded-lg border-2 transition-all ${formData.mainColor === color.value ? "border-gray-800 scale-110" : "border-gray-200"}`} style={{ backgroundColor: color.value }} title={color.name} />))}</div></div>
                <div><Label className="text-sm font-medium">サブカラー</Label><div className="grid grid-cols-7 gap-2 mt-2">{colorOptions.map((color) => (<button key={color.value} onClick={() => handleInputChange("subColor", color.value)} className={`w-10 h-10 rounded-lg border-2 transition-all ${formData.subColor === color.value ? "border-gray-800 scale-110" : "border-gray-200"}`} style={{ backgroundColor: color.value }} title={color.name} />))}</div></div>
            </div>
          </div>
      );
      case 3: return (
          <div className="space-y-6">
            {errorDetails ? (
              <Card className="border-red-500 bg-red-50"><CardHeader><CardTitle className="text-red-700">エラーが発生しました</CardTitle></CardHeader><CardContent><p className="text-red-600">以下の問題により、処理を完了できませんでした。</p><pre className="mt-2 bg-red-100 p-3 rounded-md text-sm text-red-900 whitespace-pre-wrap">{errorDetails}</pre><Button variant="outline" onClick={() => setCurrentStep(0)} className="mt-4">入力に戻る</Button></CardContent></Card>
            ) : (
              <>
                <div className="text-center space-y-2"><Sparkles className="w-12 h-12 mx-auto text-yellow-500" /><h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">プロンプト生成完了！</h2><p className="text-gray-600">以下のプロンプトをコピーしてAIツールに貼り付けてください</p></div>
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />生成されたプロンプト</CardTitle></CardHeader>
                    <CardContent>
                        <div className="bg-gray-50 p-4 rounded-lg"><pre className="whitespace-pre-wrap text-sm text-gray-800 max-h-96 overflow-y-auto">{generatedPrompt}</pre></div>
                        {!showModification ? (
                            <div className="flex gap-2 mt-4"><Button onClick={handleCopy} className="flex-1">コピー</Button><Button variant="outline" onClick={() => setShowModification(true)} className="px-6">修正</Button><Button variant="outline" onClick={resetAll}>新規作成</Button></div>
                        ) : (
                            <div className="mt-4 space-y-4">
                                <div><Label htmlFor="modification" className="text-sm font-medium">修正したい内容を教えてください</Label><Textarea id="modification" placeholder="例: もっとカジュアルなトーンにしたい..." value={modificationRequest} onChange={(e) => setModificationRequest(e.target.value)} className="mt-1" rows={4} /></div>
                                <div className="flex gap-2"><Button onClick={modifyPrompt} disabled={!modificationRequest.trim() || isModifying} className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">{isModifying ? '修正中...' : "修正を適用"}</Button><Button variant="outline" onClick={() => { setShowModification(false); setModificationRequest(""); }}>キャンセル</Button></div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                
                {/* スライド生成ツールへのリンクカード */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Presentation className="w-5 h-5" />
                      スライド生成はこちら
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                                        <div className="space-y-3">
                      <a 
                        href="https://www.genspark.ai/agents?type=slides_agent" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                      >
                        <span className="font-medium text-purple-600">Genspark</span>
                      </a>
                      <a 
                        href="https://manus.im/app" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                      >
                        <span className="font-medium text-purple-600">Manus</span>
                      </a>
                    </div>
                    
                    {/* 比較表画像 */}
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <img 
                        src="/manus-genspark-comparison.png" 
                        alt="ManusとGensparkの比較表" 
                        className="w-full max-w-full h-auto rounded-lg shadow-sm"
                      />
                    </div>
                      <p className="text-xs text-red-600 mt-3 font-medium">
                        ※無課金のアカウントは機密情報の取り扱いに注意してください
                      </p>
                    </CardContent>
                  </Card>
              </>
            )}
          </div>
      );
    }
  }

  const isNextDisabled = () => {
    const disabled = currentStep === 0 ? !formData.slideTheme : 
                   currentStep === 1 ? !formData.audience || !formData.purpose || !formData.keyMessage :
                   currentStep === 2 ? !formData.designStyle || !formData.tone || !formData.mainColor || !formData.subColor :
                   true;
    
    console.log('Debug info:', {
      currentStep,
      formData,
      disabled,
      slideTheme: formData.slideTheme,
      slideThemeLength: formData.slideTheme?.length
    });
    
    return disabled;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-50"><div className="container mx-auto px-4 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center"><Sparkles className="w-6 h-6 text-white" /></div><div><h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">スライド用プロンプト作るくん</h1><p className="text-sm text-gray-600">AI用プロンプト生成ツール</p></div></div></div></header>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8"><div className="flex items-center justify-center space-x-4">{steps.map((step, index) => { const Icon = step.icon; const isActive = index === currentStep; const isCompleted = index < currentStep; return (<div key={index} className="flex items-center"><div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${isActive ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-110" : isCompleted ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}><Icon className="w-6 h-6" /></div><div className="ml-2 hidden sm:block"><p className={`text-sm font-medium ${isActive ? "text-purple-600" : "text-gray-500"}`}>{step.title}</p></div>{index < steps.length - 1 && (<div className={`w-8 h-0.5 mx-4 ${isCompleted ? "bg-green-500" : "bg-gray-200"}`} />)}</div>)})}</div></div>
        <Card className="max-w-2xl mx-auto shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            {renderStep()}
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0 || currentStep === 3} className="px-6">戻る</Button>
              {currentStep < 2 ? (
                  <Button 
                    onClick={() => setCurrentStep(currentStep + 1)} 
                    disabled={isNextDisabled()} 
                    className="px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    title={`Debug: slideTheme="${formData.slideTheme}", disabled=${isNextDisabled()}`}
                  >
                    次へ
                  </Button>
              ) : currentStep === 2 ? (
                  <Button onClick={generatePrompt} disabled={isNextDisabled() || isGenerating} className="px-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">{isGenerating ? '生成中...' : "プロンプト生成"}</Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}