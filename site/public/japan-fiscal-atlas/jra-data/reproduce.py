"""Python 3.10+. Read the three adjacent CSVs and reproduce the 12 forecasts."""
import csv
from pathlib import Path
from statistics import mean, linear_regression

base = Path(__file__).resolve().parent
def load(file, key):
    with (base / file).open(encoding="utf-8-sig") as f:
        return {int(r[key]): r for r in csv.DictReader(f)}

fiscal = load("fiscal.csv","年度")
sales = load("sales.csv","year")
submissions = load("submissions.csv","year")
def budget(y):
    return int(fiscal[y]["当初予算額_円"])/1e8
def actual(y):
    return int(fiscal[y]["収納済歳入額_円"])/1e8
def growth(y, cutoff):
    for k in (y-2,y-1):
        assert sales[k]["available_by"] <= cutoff
    return int(sales[y-1]["sales_oku"])/int(sales[y-2]["sales_oku"])-1

with (base / "results.csv").open("w",encoding="utf-8-sig",newline="") as f:
    out=csv.writer(f)
    out.writerow(["年度","予算成立日","学習開始","学習終了","当初予算","平均補正","売得金回帰","決算","平均補正の改善額","回帰の改善額"])
    for y in range(2013,2025):
        cutoff=fiscal[y]["予算成立日"]
        train=range(y-11,y-1)
        assert all(fiscal[t]["予算成立日"] <= submissions[t]["submitted_on"] < cutoff for t in train)
        bias=[actual(t)/budget(t)-1 for t in train]
        slope,intercept=linear_regression([growth(t,cutoff) for t in train],bias)
        b=budget(y)
        m=b*(1+mean(bias))
        r=b*(1+intercept+slope*growth(y,cutoff))
        a=actual(y)
        out.writerow([y,cutoff,train.start,train.stop-1,*[round(v,6) for v in (b,m,r,a,abs(b-a)-abs(m-a),abs(b-a)-abs(r-a))]])
