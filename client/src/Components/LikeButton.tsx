import { Heart } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {useAuth } from "../hooks/useAuth";
import { api } from "../api";
export function LikeButton({
    id,
    liked: initialLiked,
    count: initialCount,

}: {
    id: string;
    liked: boolean;
    count: number;
}) {
    const [state, setState] = useState({
        liked: initialLiked,
        likeCount: initialCount,
    })
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    async function toggle() {
        if (!user) {
            navigate(
                `/login?next=${encodeURIComponent(location.pathname + location.search)}`,

            );
            return;
        }
        setBusy(true);
        setError("");
        try {
            setState(await api.like(id, !state.liked));
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setBusy(false);
        }
    }
    return (
        <span className="like-warp">
            <button
            type= "button"
            className={`like ${state.liked ? "liked" : ""}`}
            disabled={busy}
            onClick={() => void toggle()}
            aria-pressed={state.liked}
            >
                <Heart size={16} fill={state.liked ? "currentColor" : "none"} />
                {state.likeCount}
            </button>
            {error && (
                <span role= "alert" className="small-error">
                    {error}
                    </span>
            )}
        </span>
    );
}