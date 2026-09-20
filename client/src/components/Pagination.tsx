import { ArrowLeft, ArrowRight } from "lucide-react";
export function Pagination({
    page,
    pages,
    onChange,
}: {
    page: number;
    pages: number;
    onChange: (page: number) => void;

}) {
    if (pages <= 1) return null;
    return (
        <nav className="pagination" aria-label="Pagination">
            <button
            className="button secondary"
            disabled={page <= 1}
            onClick={() => onChange(page - 1)}
            >
                <ArrowLeft size={16} /> Previous
            </button>
            <span>
                Page {page} of {pages}
            </span>
            <button
            className="button secondary"
            disabled={page >= pages}
            onClick={() => onChange(page + 1)}
            >
                Next <ArrowRight size={16} />
            </button>
        </nav>
    );
}