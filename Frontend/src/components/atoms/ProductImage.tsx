import { ImgHTMLAttributes, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import placeholderNeg from "@/assets/laqq_marca_color_neg.svg";
import placeholderPos from "@/assets/laqq_marca_color_pos.svg";
import { ensureHttpsUrl } from "@/utils/secureUrl";

type ProductImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
};

export function getLaqqLogoFallback(theme?: string) {
  return theme === "dark" ? placeholderNeg : placeholderPos;
}

const ProductImage = ({ src, alt, onError, ...rest }: ProductImageProps) => {
  const { resolvedTheme } = useTheme();
  const fallback = getLaqqLogoFallback(resolvedTheme);
  const initial = ensureHttpsUrl(src) || fallback;
  const [current, setCurrent] = useState(initial);
  const [usedFallback, setUsedFallback] = useState(!src);

  useEffect(() => {
    const next = ensureHttpsUrl(src) || fallback;
    setCurrent(next);
    setUsedFallback(!src);
  }, [src, fallback]);

  return (
    <img
      {...rest}
      src={current}
      alt={alt}
      onError={(event) => {
        if (!usedFallback) {
          setUsedFallback(true);
          setCurrent(fallback);
        }
        onError?.(event);
      }}
    />
  );
};

export default ProductImage;
