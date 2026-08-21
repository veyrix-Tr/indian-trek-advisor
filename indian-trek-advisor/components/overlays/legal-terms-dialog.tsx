"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface LegalTermsDialogProps {
  open: boolean
  onClose: () => void
}

export function LegalTermsDialog({ open, onClose }: LegalTermsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] w-[95vw] overflow-y-auto rounded-2xl border-border bg-card p-0 shadow-2xl sm:max-w-2xl md:max-w-3xl">
        <DialogHeader className="sticky top-0 z-10 border-b border-border bg-card px-8 pb-5 pt-8">
          <DialogTitle className="flex items-center gap-2.5 text-xl text-foreground">
            <span className="text-2xl">⚖️</span>
            Terms, Conditions &amp; Disclaimer
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Core Trek-kin — Platform Terms of Use &amp; Liability
            Disclaimer
          </p>
        </DialogHeader>

        <div className="space-y-7 px-8 pb-8 pt-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h3 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              1. Nature of the Platform
            </h3>
            <p>
              <strong className="text-foreground">Core Trek-kin</strong> is
              an <strong className="text-foreground">information and community
              listing service only</strong>. We are not a travel agency, tour
              operator, trekking company, or adventure sports organiser. We do
              not plan, operate, conduct, supervise, or lead any trek, yatra, or
              outdoor activity.
            </p>
            <p className="mt-2.5">
              All guides, gear rental operators, and service providers listed on
              this platform are{" "}
              <strong className="text-foreground">
                independent third parties
              </strong>
              . Core Trek-kin has no employment, agency, or contractual
              relationship with any listed guide or operator.
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              2. Assumption of Risk
            </h3>
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-xs leading-relaxed">
              <strong className="text-destructive">⚠ CRITICAL:</strong>{" "}
              Trekking, mountaineering, high-altitude travel, and related
              outdoor activities involve{" "}
              <strong className="text-foreground">
                serious, inherent, and unavoidable risks
              </strong>{" "}
              including death, permanent disability, altitude sickness (AMS,
              HACE, HAPO), hypothermia, frostbite, avalanche, rockfall, flash
              floods, wildlife encounters, cardiac events, falls, and getting
              lost.
            </div>
            <p className="mt-2.5">
              By using this Platform, you{" "}
              <strong className="text-foreground">
                voluntarily and knowingly assume all risks
              </strong>{" "}
              associated with any trekking activity you undertake, whether or
              not you engaged a guide or rented equipment through this Platform.
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              3. Limitation of Liability
            </h3>
            <p>
              To the maximum extent permitted by applicable law, Core Trek-kin, its founders, directors, employees, affiliates, partners,
              and agents shall not be liable for:
            </p>
            <ul className="mt-2.5 list-disc space-y-1.5 pl-5 marker:text-primary/50">
              <li>
                Any death, personal injury, illness, disability, or physical
                harm arising from any trek or outdoor activity
              </li>
              <li>
                Any loss, damage, theft, or destruction of personal property
              </li>
              <li>
                Any financial loss arising from transactions with guides,
                operators, or other users
              </li>
              <li>
                Any fraudulent misrepresentation by a listed guide, operator, or
                user
              </li>
              <li>
                The accuracy, completeness, or currency of trail information,
                difficulty ratings, or permit requirements
              </li>
              <li>
                The conduct, competence, certification, or fitness of any listed
                guide or gear operator
              </li>
              <li>
                Any loss arising from reliance on AI-generated content or
                recommendations
              </li>
            </ul>
          </section>

          <section>
            <h3 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              4. Guide &amp; Operator Liability
            </h3>
            <p>
              Guides and gear operators are{" "}
              <strong className="text-foreground">
                independent contractors
              </strong>
              , not employees or agents of Core Trek-kin. Any agreement
              you make with a guide or operator is solely between you and that
              individual or entity.
            </p>
            <p className="mt-2.5">
              We strongly recommend: (a) verifying guide credentials
              independently before hiring; (b) signing a separate written
              agreement with your guide; (c) inspecting all rented equipment
              before departure; (d) obtaining comprehensive travel and medical
              evacuation insurance.
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              5. Trail &amp; Permit Information
            </h3>
            <p>
              Trail data, elevation profiles, difficulty ratings, permit
              requirements, fees, distances, itineraries, and seasonal
              information are provided{" "}
              <strong className="text-foreground">for general guidance only</strong>.
              They may be inaccurate, outdated, or incomplete. You must
              independently verify all permit requirements with the relevant
              Forest Department, District Administration, or competent authority
              before undertaking any trek.
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              6. Indemnification
            </h3>
            <p>
              You agree to{" "}
              <strong className="text-foreground">
                indemnify, defend, and hold harmless
              </strong>{" "}
              Core Trek-kin from any claims, damages, losses, liabilities,
              costs, and expenses arising from your use of the Platform, your
              violation of these Terms, your participation in any trekking or
              outdoor activity, any content you submit, or any dispute between
              you and any guide, operator, or other user.
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              7. Guide Responsibilities
            </h3>
            <p>
              If you register as a Local Guide, you represent and warrant that:
            </p>
            <ul className="mt-2.5 list-disc space-y-1.5 pl-5 marker:text-primary/50">
              <li>All information you provide is true, accurate, and current</li>
              <li>
                You hold all necessary certifications, licences, and insurance
                required by law
              </li>
              <li>
                You carry adequate liability insurance for guiding activities
              </li>
              <li>
                You will conduct yourself professionally and in accordance with
                applicable law
              </li>
            </ul>
          </section>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-xs leading-relaxed text-primary">
            <strong>This platform is an information service only. Not a tour
            operator.</strong> See the full terms above for complete details.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}