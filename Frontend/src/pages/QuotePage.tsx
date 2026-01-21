import QuoteRequest from "@/components/organisms/QuoteRequest";
import { useAppDispatch } from "@/store/hooks";
import { fetchAllProducts, fetchProducts } from "@/store/productSlice";
import { useEffect } from "react";

const QuotePage = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchAllProducts());
  }, [dispatch]);
  return <QuoteRequest />;
};

export default QuotePage;
