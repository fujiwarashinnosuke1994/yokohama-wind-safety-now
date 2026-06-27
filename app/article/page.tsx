import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "横浜市の風速をリアルタイムに近い形で確認できる防災アプリを公開しました",
  description: "Yokohama Wind & Safety Now の開発背景、対象者、データソース、OSS としての改善方針を紹介します。"
};

export default function ArticlePage() {
  return (
    <main className="min-h-svh px-4 py-6 sm:px-6 sm:py-10">
      <article className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-soft sm:p-10">
        <p className="text-sm font-extrabold text-bay-700">Yokohama Wind & Safety Now</p>
        <h1 className="mt-3 text-3xl font-black leading-tight tracking-normal text-slate-950 sm:text-5xl">
          横浜市の風速をリアルタイムに近い形で確認できる防災アプリを公開しました
        </h1>
        <p className="mt-4 text-sm font-extrabold text-slate-700">
          開発：株式会社数強塾 / 藤原進之介
        </p>

        <div className="mt-8 space-y-8 text-base leading-8 text-slate-700">
          <section>
            <h2 className="text-xl font-extrabold text-slate-950">なぜ作ったのか</h2>
            <p className="mt-3">
              Yokohama Wind & Safety Now は、横浜市中心部の風速・風向・過去60分程度の推移を、リアルタイムに近い形で確認できる防災・外出判断補助アプリです。株式会社数強塾 代表 藤原進之介が、通学・通塾・送迎・外出判断の補助を目的として開発しました。
            </p>
            <p className="mt-3">
              日々の移動では、雨だけでなく風の強さも判断材料になります。特に子どもの送迎、自転車移動、塾や習い事への移動、車のドア開閉、海沿いの移動では、風の影響を事前に知ることが役立ちます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-950">横浜で風を確認する意味</h2>
            <p className="mt-3">
              横浜は、みなとみらい、山下公園、横浜港周辺のような海沿いのエリアがあり、橋の上や高層ビル周辺では風の影響を受けやすい場面があります。同じ風速でも、地形、建物、交通状況、移動手段によって体感やリスクは変わります。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-950">誰に役立つのか</h2>
            <p className="mt-3">
              子育て世帯にとっては、お子様の送迎、ベビーカー移動、公園や習い事前の確認に使えます。中学生・高校生にとっては、登校、下校、塾への移動、部活動前後の確認に役立ちます。保護者様にとっては、通学・通塾・送迎時の判断補助になります。
            </p>
            <p className="mt-3">
              通勤者にとっては、駅までの移動や自転車通勤の確認に使えます。車を運転する方にとっては、車のドア開閉、橋や海沿い道路、飛来物リスクの把握に役立つ補助情報になります。横浜観光や海沿い移動の前にも、風の状態を確認できます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-950">安全を保証するものではありません</h2>
            <p className="mt-3">
              このアプリは、運転できる、外出して安全である、と断定するものではありません。表示される風速、風向、推移グラフはあくまで補助情報です。避難情報、警報、交通情報、道路状況、公共交通機関の運行状況が必要な場合は、気象庁、横浜市、交通機関などの公式情報を必ず確認してください。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-950">データソースと更新頻度の限界</h2>
            <p className="mt-3">
              データソースには Open-Meteo API を利用しています。APIキーなしで利用でき、現在値、過去60分程度の推移、過去12時間、過去30日の風速推移を取得します。ただし、観測値の更新頻度や過去データの粒度はデータ提供元に依存します。アプリが60秒ごとに取得しても、提供元の値が更新されていない場合は、表示が変わらないことがあります。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-950">OSSとして改善していく方針</h2>
            <p className="mt-3">
              Yokohama Wind & Safety Now は、防災、Civic Tech、Public Safety、Mobility Safety の観点から、地域の外出判断を支える小さな公共的ツールとして改善していきます。今後は、表示のわかりやすさ、アクセシビリティ、複数地点対応、公式防災リンクの追加などを進めていく予定です。
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
