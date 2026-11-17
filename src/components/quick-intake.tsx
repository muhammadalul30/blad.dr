import { quickIntake } from "@/actions/records";

const VOLUMES = [150, 200, 250, 330, 500, 600];

/** Tombol sekali ketuk: air putih, dicatat pada jam sekarang. */
export function QuickIntake() {
  return (
    <div>
      <p className="mb-2 text-xs text-muted">Air putih, dicatat pada jam sekarang:</p>
      <div className="flex flex-wrap gap-1.5">
        {VOLUMES.map((volume) => (
          <form key={volume} action={quickIntake}>
            <input type="hidden" name="kind" value="air" />
            <input type="hidden" name="volumeMl" value={volume} />
            <button type="submit" className="btn num">
              +{volume} ml
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
