import Image from "next/image";

type ComingSoonCoverProps = {
  imageSrc: string;
  tone: "recycle" | "marketplace" | "dao";
};

export default function ComingSoonCover({ imageSrc, tone }: ComingSoonCoverProps) {
  return (
    <section className={`coming-soon-cover is-${tone}`} aria-label="Coming soon">
      <Image className="coming-soon-cover__image" src={imageSrc} alt="" fill sizes="360px" priority />
      <span className="coming-soon-cover__label">Coming soon</span>
    </section>
  );
}
