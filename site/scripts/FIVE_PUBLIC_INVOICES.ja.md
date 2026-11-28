# 公開サンプル5件追加（合計15件）

既存10件を維持し、異なるレイアウトの公開PDFを5件追加します。既存PDFの画像変換による水増しではありません。

| ID | 公開元のサンプル | 読み取り課題 |
|---|---|---|
| 11 | Microinvoice / Big Corp | 負の割引行、単価の記載なし |
| 12 | go-invoice-generator / Test Company | 行別の税・固定額／割合の割引 |
| 13 | famoser / UZH-ZI-5 | 作業期間、時間単位、通貨の記載なし |
| 14 | invoice2data / Sammy Maystone | 明細内の説明・部品・税注記 |
| 15 | invoice2data / Azure Interior | 部門別小計、商品コード、割引 |

原本は改変せず配布しています。public-samples.json に取得元、固定コミット、SHA-256、転記上の判断を記録しました。各PDFにライセンスファイルを付属し、Apache-2.0のsample-12にはNOTICEも含めています。これらは既存公開プロジェクトのサンプルであり、実取引の請求書と認定したものではありません。

デモの値は原本を目視転記したものです。AI抽出結果や完全な正解データセットを意味しません。割引・税の計算処理を追加したわけではなく、対応する発注書がないため5件とも要確認に留まります。PO番号が印刷されていても発注書の存在を意味しません。欠落した通貨・単価はnullのままです。

## ローカルモデルで抽出する

下記はポートフォリオ更新適用後に実行してください。推論は5回行います。既存の抽出結果やデモ転記データは上書きしません。

```bash
cd "$HOME/projects/invoice-workflow-public"
python_bin="$HOME/projects/invoice-workflow/.venv/bin/python"
source_dir="$HOME/projects/invoiceflow-portfolio-update/site/public/projects/invoiceflow/review"
result_dir="$(mktemp -d "$PWD/vision-results-five-XXXXXX")"
for number in 11 12 13 14 15; do
  "$python_bin" extract_invoice.py \
    --input "$source_dir/sample-$number.pdf" \
    --output "$result_dir" \
    --model qwen3.5:9b-q8_0 \
    --line-structure || break
done
printf '結果フォルダ: %s\n' "$result_dir"
```

次に各invoice.jsonを原本と比較します。抽出が正常終了したことと値の正確性は別です。転記データとの差は、数値、小数表記、欠落、行の境界、割引・税の意味を分けて評価してください。モデル出力をデモに反映する場合も原文と修正履歴を残します。

## 検証

- Python bridge: 15件、5件追加、原本ハッシュ、MIT/Apache通知、null・負額の保持、承認保留、修正履歴を確認。
- Astroビルド成功。
- ブラウザ上で15件の一覧、追加5件の詳細・出典リンク、原本PDF描画を確認。
- AI推論は本更新の作成環境では実行していません。
