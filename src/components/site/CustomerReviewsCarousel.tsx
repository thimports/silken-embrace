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
import r10 from "@/assets/reviews/r10.jpg";
import r11 from "@/assets/reviews/r11.jpg";
import r12 from "@/assets/reviews/r12.jpg";
import r13 from "@/assets/reviews/r13.jpg";
import r14 from "@/assets/reviews/r14.jpg";
import r15 from "@/assets/reviews/r15.jpg";
import r16 from "@/assets/reviews/r16.jpg";
import r17 from "@/assets/reviews/r17.jpg";

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
  { img: r10, name: "Bruna F.", text: "Caimento maravilhoso, modela super bem" },
  { img: r11, name: "Tatiane M.", text: "Translúcida e quentinha, melhor que esperava" },
  { img: r12, name: "Vanessa G.", text: "Servir até o 44 mesmo, vestiu lindo" },
  { img: r13, name: "Daniela H.", text: "Felpinha por dentro, parece carinho na pele" },
  { img: r14, name: "Sabrina B.", text: "Não rasga fácil, tecido super resistente" },
  { img: r15, name: "Larissa V.", text: "Levantou o bumbum, amei o efeito modelador" },
  { img: r16, name: "Cristina N.", text: "Combina com vestido, saia, tudo. Indispensável" },
  { img: r17, name: "Eduarda K.", text: "O forro felpudo é incrível, vale cada centavo" },
];

export function CustomerReviewsCarousel() {
  return (
    <div className="mt-8">
      <h3 className="text-center text-[15px] md:text-base text-foreground">
        Mais de <strong>10.000 clientes</strong> já compraram a<br />
        Meia-Calça Forrada Térmica Lumière
      </h3>

      <div className="mt-5 -mx-5 md:mx-0 overflow-hidden group">
        <div className="flex gap-3 w-max animate-marquee group-hover:[animation-play-state:paused]">
          {[...REVIEWS, ...REVIEWS].map((r, i) => (
            <article
              key={i}
              className="shrink-0 w-[160px] md:w-[180px] bg-cream border border-border shadow-soft overflow-hidden"
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
