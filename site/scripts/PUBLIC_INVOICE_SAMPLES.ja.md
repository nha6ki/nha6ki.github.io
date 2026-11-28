# 公開請求書サンプル3件の追加

既存7件に3件を追加し、公開Invoice Reviewを10件にします。

| 原本 | 形式 | 特徴 |
| --- | --- | --- |
| Trey Hunner / Joe Shmoe | PDF | 時間単価、日別作業、経費、丸め差 |
| Sparksuite | PDF | 品目と金額のみ、数量・単価の記載なし |
| NI57721 | PNG | 日本語、消費税、振込先、押印 |

これらは外部で公開されたテンプレートのサンプルです。実取引の請求書ではありません。
原本は改変せず配布し、MITライセンス文を同梱します。出典URL・固定コミット・SHA-256はpublic-samples.jsonに記録しています。
SparksuiteのPDFはGotenbergリポジトリで配布されたテンプレートの印刷例です。PDF自体にもMITライセンスへのリンクがあります。

## データの扱い

今回のJSONは手作業による転記で、Ollamaの出力ではありません。明細IDは表示順の参照番号です。時間単価型の品目名には見出しと日付を組み合わせています。
ドル記号の2例は米国住所からUSDと解釈しています。欠損数量・単価・請求書番号・発注番号は推定で埋めません。
税込合計フィールドには原本のTotal / Balance Dueを格納します。英語2例は税の内訳がなく、税抜・税込の別を独立に保証するものではありません。
Joe Shmoe原本の小計419.08は各行の丸め後合計419.09と0.01異なります。原本どおり保存しています。
発注書は付属していないためreview_onlyとして登録し、修正と履歴保存は可能、承認・台帳登録は不可とします。

## 公開サイトへの反映

このZIPのupdate.patchはポートフォリオのコミット176ddc7に対する差分です。git apply --checkが失敗した場合は上書きせず停止してください。

```bash
cd "$HOME/projects/invoiceflow-portfolio-update"
git switch redesign-astro &&
git pull --ff-only origin redesign-astro &&
git apply --check /tmp/invoiceflow-three-public/update.patch &&
git apply --index /tmp/invoiceflow-three-public/update.patch &&
python3 site/scripts/check-invoice-review-corrections.py &&
npm --prefix site run build &&
git commit -m "Add three public invoice layouts with source attribution" &&
git push origin redesign-astro
```

## ローカルAI抽出を別途試す

既存InvoiceFlowの環境とOllamaの起動・接続設定を使います。次の処理は未実行です。成功率はまだ評価していません。

```bash
cd "$HOME/projects/invoice-workflow-public"
for source in /tmp/invoiceflow-three-public/documents/sample-8.pdf \
              /tmp/invoiceflow-three-public/documents/sample-9.pdf \
              /tmp/invoiceflow-three-public/documents/sample-10.png
do
  "$HOME/projects/invoice-workflow/.venv/bin/python" extract_invoice.py \
    --input "$source" --output vision-results-public-layouts \
    --model qwen3.5:9b-q8_0 || break
done
```

出力を原本と比較してから、AI抽出結果として公開デモに取り込むか判断します。今回の転記JSONを無条件に完全な正解データとして採点しないでください。

## 検証

- 10件の初期化、既存UC12修正履歴・競合防止の回帰テスト
- 追加3件の欠損値・出典・SHA-256・ライセンス・承認停止・修正履歴を検証
- ブラウザ上の一覧、3件の詳細、PDF2件とPNG1件の表示を確認
- ブラウザCIにも3件の原本リンク確認を追加
- モバイル専用の表示検証とAI推論は今回未実施
