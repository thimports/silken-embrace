import { Star } from "lucide-react";
import r1 from "@/assets/reviews/r1.jpg";
import r2 from "@/assets/reviews/r2.jpg";
import r3 from "@/assets/reviews/r3.jpg";
import r4 from "@/assets/reviews/r4.jpg";
import r5 from "@/assets/reviews/r5.jpg";
import r6 from "@/assets/reviews/r6.jpg";
import r7 from "@/assets/reviews/r7.jpg";
import r8 from "@/assets/reviews/r8.jpg";
import r9 from "@/assets/reviews/r9.jpg";

const REVIEWS = [
  { img: r1, name: "Mariana A.", text: "Aquece muito, super confortável. Amei!" },
  { img: r2, name: "Camila O.", text: "Veste muito bem, virei cliente fiel" },
  { img: r3, name: "Júlia S.", text: "Modela e disfarça tudo, tecido luxuoso" },
  { img: r4, name: "Beatriz M.", text: "Plus size que veste perfeito, elegantíssima" },
  { img: r5, name: "Patrícia L.", text: "Combina com tudo, look impecável" },
  { img: r6, name: "Fernanda T.", text: "Não enrola, não marca. Recomendo demais" },
  { img: r7, name: "Luiza R.", text: "Translucidez perfeita, parece europeia" },
  { img: r8, name: "Renata C.", text: "Salvou meu inverno, quentinha de verdade" },
  { img: r9, name: "Aline P.", text: "Acabamento impecável, comprei outra cor" },
];

export function CustomerReviewsCarousel() {
  return (
    <div className="mt-8">
      <h3 className="text-center text-[15px] md:text-base text-foreground">
        Mais de <strong>10.000 clientes</strong> já compraram a<br />
        Meia-Calça Forrada Térmica Lumière
      </h3>

      <div className="mt-5 -mx-5 md:mx-0">
        <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory px-5 md:px-0 pb-2">
          {REVIEWS.map((r, i) => (
            <article
              key={i}
              className="snap-start shrink-0 w-[160px] md:w-[180px] bg-cream border border-border shadow-soft overflow-hidden"
            >
              <div className="aspect-[3/4] overflow-hidden bg-secondary/60">
                <img
                  src={r.img}
                  alt={`Avaliação de ${r.name}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-medium text-foreground">{r.name}</span>
                  <Star className="h-3 w-3 fill-caramel text-caramel" strokeWidth={0} />
                </div>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground line-clamp-2">
                  {r.text}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
