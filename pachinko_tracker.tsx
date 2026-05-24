<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>パチンコ・スロット収支管理ツール</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-slate-50 text-slate-800 antialiased">
    <div id="root"></div>

    <script type="text/babel">
        const { useState, useEffect } = React;

        function PachinkoTracker() {
            // 基本情報
            const [storeName, setStoreName] = useState('');
            const [userName, setUserName] = useState('');
            const [modelName, setModelName] = useState('');
            const [unitNumber, setUnitNumber] = useState('');
            const [prevData, setPrevData] = useState('');

            // 玉・投資情報
            const [mySavings, setMySavings] = useState('');
            const [useSavings, setUseSavings] = useState('');
            const [otherSavings, setOtherSavings] = useState('');
            const [gameCountCash, setGameCountCash] = useState('');
            const [cashInvestment, setCashInvestment] = useState('');
            const [recovery, setRecovery] = useState('');
            const [totalBalls, setTotalBalls] = useState('');
            const [expectedValue, setExpectedValue] = useState('');

            // 打ち始め・当たり記録
            const [records, setRecords] = useState([{ id: 1, start: '', hit: '', end: '' }]);

            // ローカルストレージから復元
            useEffect(() => {
                const saved = localStorage.getItem('pachinko_tracker_data');
                if (saved) {
                    try {
                        const d = JSON.parse(saved);
                        setStoreName(d.storeName || ''); setUserName(d.userName || '');
                        setModelName(d.modelName || ''); setUnitNumber(d.unitNumber || ''); setPrevData(d.prevData || '');
                        setMySavings(d.mySavings || ''); setUseSavings(d.useSavings || ''); setOtherSavings(d.otherSavings || '');
                        setGameCountCash(d.gameCountCash || ''); setCashInvestment(d.cashInvestment || '');
                        setRecovery(d.recovery || ''); setTotalBalls(d.totalBalls || ''); setExpectedValue(d.expectedValue || '');
                        if (d.records) setRecords(d.records);
                    } catch(e) {}
                }
            }, []);

            // 自動保存
            useEffect(() => {
                const data = {
                    storeName, userName, modelName, unitNumber, prevData,
                    mySavings, useSavings, otherSavings, gameCountCash, cashInvestment,
                    recovery, totalBalls, expectedValue, records
                };
                localStorage.setItem('pachinko_tracker_data', JSON.stringify(data));
            }, [storeName, userName, modelName, unitNumber, prevData, mySavings, useSavings, otherSavings, gameCountCash, cashInvestment, recovery, totalBalls, expectedValue, records]);

            const addRecord = () => {
                setRecords([...records, { id: records.length + 1, start: '', hit: '', end: '' }]);
            };

            const updateRecord = (id, field, value) => {
                setRecords(records.map(r => r.id === id ? { ...r, [field]: value } : r));
            };

            const handleReset = () => {
                if(confirm('入力をすべて消去しますか？')) {
                    setStoreName(''); setUserName(''); setModelName(''); setUnitNumber(''); setPrevData('');
                    setMySavings(''); setUseSavings(''); setOtherSavings(''); setGameCountCash(''); setCashInvestment('');
                    setRecovery(''); setTotalBalls(''); setExpectedValue('');
                    setRecords([{ id: 1, start: '', hit: '', end: '' }]);
                }
            };

            // テキストコピー用のフォーマット生成
            const generateCopyText = () => {
                let text = `【店名】${storeName}\n【名前】${userName}\n【機種名】${modelName}\n【台番】${unitNumber}\n【前日などなど】${prevData}\n\n`;
                text += `【自分の貯玉】${mySavings}\n【貯玉から使用玉】${useSavings}\n【貯玉以外の持ち玉】${otherSavings}\n【現金投資になったゲーム数】${gameCountCash}\n【現金投資円】${cashInvestment}\n【回収（枚）】${recovery}\n【総貯玉】${totalBalls}\n【期待値】${expectedValue}\n\n`;
                text += `■打ち始め・当たり記録\n`;
                records.forEach((r, i) => {
                    text += `${i+1}台目: 打ち始め[${r.start}] 当たり[${r.hit}] やめ[${r.end}]\n`;
                });
                return text;
            };

            const handleCopy = () => {
                navigator.clipboard.writeText(generateCopyText());
                alert('テキストをコピーしました！');
            };

            return (
                <div class="max-w-4xl mx-auto p-4 md:p-6">
                    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
                        <div class="flex justify-between items-center mb-6">
                            <h1 class="text-xl font-bold flex items-center gap-2 text-indigo-600">
                                <i class="fa-solid fa-coins"></i> 収支記録ツール
                            </h1>
                            <button onClick={handleReset} class="text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg transition">リセット</button>
                        </div>

                        {/* 基本情報 */}
                        <div class="mb-6">
                            <h2 class="font-bold text-sm text-slate-500 uppercase tracking-wider mb-3">基本情報</h2>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label class="block text-xs font-medium text-slate-600 mb-1">店名</label><input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" /></div>
                                <div><label class="block text-xs font-medium text-slate-600 mb-1">名前</label><input type="text" value={userName} onChange={e => setUserName(e.target.value)} class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" /></div>
                                <div><label class="block text-xs font-medium text-slate-600 mb-1">機種名</label><input type="text" value={modelName} onChange={e => setModelName(e.target.value)} class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" /></div>
                                <div><label class="block text-xs font-medium text-slate-600 mb-1">台番</label><input type="text" value={unitNumber} onChange={e => setUnitNumber(e.target.value)} class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" /></div>
                            </div>
                            <div class="mt-3">
                                <label class="block text-xs font-medium text-slate-600 mb-1">前日などなど</label>
                                <textarea value={prevData} onChange={e => setPrevData(e.target.value)} rows="2" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"></textarea>
                            </div>
                        </div>

                        <hr class="border-slate-100 my-6" />

                        {/* 玉・投資情報 */}
                        <div class="mb-6">
                            <h2 class="font-bold text-sm text-slate-500 uppercase tracking-wider mb-3">玉・投資情報</h2>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label class="block text-xs font-medium text-slate-600 mb-1">自分の貯玉</label><input type="text" value={mySavings} onChange={e => setMySavings(e.target.value)} class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" /></div>
                                <div><label class="block text-xs font-medium text-slate-600 mb-1">貯玉から使用玉</label><input type="text" value={useSavings} onChange={e => setUseSavings(e.target.value)} class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" /></div>
                                <div><label class="block text-xs font-medium text-slate-600 mb-1">貯玉以外の持ち玉</label><input type="text" value={otherSavings} onChange={e => setOtherSavings(e.target.value)} class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" /></div>
                                <div><label class="block text-xs font-medium text-slate-600 mb-1">現金投資になったゲーム数</label><input type="text" value={gameCountCash} onChange={e => setGameCountCash(e.target.value)} class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" /></div>
                                <div><label class="block text-xs font-medium text-slate-600 mb-1">現金投資円</label><input type="text" value={cashInvestment} onChange={e => setCashInvestment(e.target.value)} class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" /></div>
                                <div><label class="block text-xs font-medium text-slate-600 mb-1">回収（枚）</label><input type="text" value={recovery} onChange={e => setRecovery(e.target.value)} class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" /></div>
                                <div><label class="block text-xs font-medium text-slate-600 mb-1">総貯玉</label><input type="text" value={totalBalls} onChange={e => setTotalBalls(e.target.value)} class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" /></div>
                                <div><label class="block text-xs font-medium text-slate-600 mb-1">期待値</label><input type="text" value={expectedValue} onChange={e => setExpectedValue(e.target.value)} class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" /></div>
                            </div>
                        </div>

                        <hr class="border-slate-100 my-6" />

                        {/* 打ち始め・当たり記録 */}
                        <div class="mb-6">
                            <div class="flex justify-between items-center mb-3">
                                <h2 class="font-bold text-sm text-slate-500 uppercase tracking-wider">打ち始め・当たり記録</h2>
                                <button onClick={addRecord} class="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-2.5 py-1.5 rounded-lg font-medium transition">+ 台数を追加</button>
                            </div>
                            {records.map((record, index) => (
                                <div key={record.id} class="bg-slate-50 rounded-xl p-4 mb-3 border border-slate-150">
                                    <span class="text-xs font-bold text-slate-400 block mb-2">台数: {index + 1}</span>
                                    <div class="grid grid-cols-3 gap-3">
                                        <div><label class="block text-[10px] uppercase font-bold text-slate-500 mb-1">打ち始め</label><input type="text" value={record.start} onChange={e => updateRecord(record.id, 'start', e.target.value)} class="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-indigo-500" /></div>
                                        <div><label class="block text-[10px] uppercase font-bold text-slate-500 mb-1">当たり</label><input type="text" value={record.hit} onChange={e => updateRecord(record.id, 'hit', e.target.value)} class="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-indigo-500" /></div>
                                        <div><label class="block text-[10px] uppercase font-bold text-slate-500 mb-1">やめ</label><input type="text" value={record.end} onChange={e => updateRecord(record.id, 'end', e.target.value)} class="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-indigo-500" /></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 出力プレビュー ＆ コピーボタン */}
                        <div class="mt-8 bg-slate-900 text-slate-100 rounded-xl p-4 relative">
                            <span class="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-2">出力プレビュー</span>
                            <pre class="text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-40 text-slate-300">
                                {generateCopyText()}
                            </pre>
                            <button onClick={handleCopy} class="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-sm font-medium transition shadow-sm">
                                テキストをコピー
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<PachinkoTracker />);
    </script>
</body>
</html>
