---
theme: ../themes/taloscon2026
title: 'Talos Linux: The OS That Never Stops Reconciling'
author: Andrey Smirnov
layout: cover
---

# Talos Linux: The OS That Never Stops Reconciling

Andrey Smirnov

Engineering Lead @ Sidero Labs

---

# Agenda

- A bit of history: machine config, bootkube and reboots
- The trouble with a sequential boot
- Why controllers & resources? Meet COSI
- Demo: Reconciliation Theatre
- What COSI gave us: Talos, then Omni
- We're just getting started

---
layout: image-right
image: /tbilisi.jpg
backgroundSize: cover
---

# About me

**Andrey Smirnov**<br>
Engineering Lead @ Sidero Labs

- Leading engineering for **Talos Linux** and **Omni**
- Shaping Talos since **2019**, back when “an OS with no SSH and no shell” sounded like a dare
- Since then: proving it's the right way to run Kubernetes
- Based in **Tbilisi, Georgia**

<!--
Andrey leads engineering at Sidero Labs, the team behind Talos Linux and Omni.
He's been shaping Talos since 2019, back when "an OS with no SSH and no shell"
sounded like a dare, and has spent the years since proving it's the right way
to run Kubernetes. He lives in Tbilisi, Georgia.

Photo: Tbilisi skyline with Sameba Cathedral, Wikimedia Commons, CC0.
-->

---

# A bit of history

Talos historically was:

<v-clicks>

- Minimal
- API-driven
- Secure
- Immutable <span v-click="5" class="tc-note">— more immutable than you would like it</span>

</v-clicks>

---

# Machine config: the early days

<table>
  <thead>
    <tr><th>Version</th><th>Released</th><th>Machine config</th></tr>
  </thead>
  <tbody>
    <tr v-click>
      <td>≤ v0.3</td><td>Jan 2020</td>
      <td>Loaded from external storage on every boot, never stored on disk</td>
    </tr>
    <tr v-click>
      <td>v0.4 – v0.6</td><td>Apr – Sep 2020</td>
      <td>Can be persisted on disk (<code>persist: true</code>, default since v0.5), but no API to change it</td>
    </tr>
    <tr v-click>
      <td>v0.7</td><td>Nov 2020</td>
      <td><code>ApplyConfiguration</code> API: any config change means a <strong>reboot</strong></td>
    </tr>
  </tbody>
</table>

<!--
v0.4 (feat: allow for persistence of config data) made persistence opt-in;
v0.5 (feat: make machine config persist by default) flipped the default.
v0.7 ApplyConfiguration sequence: mountState → saveConfig → unmountState → stop all → reboot.
v0.9 (Mar 2021) added `apply-config --immediate` — first changes applied without a reboot.
-->

---
clicks: 7
---

# Control plane: the bootkube era

<BootkubeDiagram />

<!--
bootkube introduced in v0.3 (Oct 2019, "feat: use bootkube for cluster creation"),
replaced in v0.9 (Mar 2021, "feat: replace bootkube with Talos-managed control plane").
Upstream bootkube templates: kube-apiserver + pod-checkpointer are DaemonSets,
controller-manager + scheduler are Deployments (pod-checkpointer, also a DaemonSet, omitted).
Bootstrap and recovery share the same fallback: render the control plane as temporary
static pods, bring up enough of the API for the self-hosted pods to start, then tear the
static pods down. Recovery: Talos recovery API (v0.5), recovers from etcd since v0.7.
-->

---

# Moving away from bootkube

<v-clicks>

- Run the control plane **natively** on Talos
- Control plane config lives in the machine config…
- …and any machine config change means a **reboot** <span v-click="4" class="tc-note">— clearly bad UX</span>

</v-clicks>

<!--
v0.9 (Mar 2021): control plane runs as static pods, "whole subsystem is managed
via resources/controllers from os-runtime" — first big user of the resource API
(introduced in the same release).
-->

---

# Not every change is a config change

<table>
  <thead>
    <tr><th>Event</th><th>Initiated by</th><th>Control plane must</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>Machine config change</td><td>user</td>
      <td>update component configuration</td>
    </tr>
    <tr v-click>
      <td>Certificates expire</td><td>time</td>
      <td>rotate certificates, restart components</td>
    </tr>
    <tr v-click>
      <td>Node addresses change (e.g. DHCP)</td><td>environment</td>
      <td>re-issue certificates with new SANs</td>
    </tr>
  </tbody>
</table>

<div v-click class="punchline">

The control plane must **react** to the node's state, not just to config<br>
<span class="tc-note">— bootkube rendered everything once, at bootstrap</span>

</div>

<style>
.punchline {
  margin-top: 28px;
}
.punchline .tc-note {
  margin-left: 0;
}
</style>

---
clicks: 10
---

# Talos v0.8: boot is a sequence

<SequenceBalloon />

<!--
Layers are grouped v0.8 sequencer phases:
Initialize: systemRequirements, integrity, discoverNetwork, setupNetwork, config;
Boot: mountState, validateConfig, saveConfig, env, containerd, sharedFilesystems,
ephemeral, verifyInstall, var, overlay, udevd, userDisks, userSetup, lvm,
startEverything, labelMaster, uncordon, bootloader.
Reboot: stopEverything, umount, unmountSystem, unmountBind, reboot.
ApplyConfiguration: mountState, saveConfig, unmountState, stop all, reboot.
Note that the network comes up before the config is even fetched.
-->

---
clicks: 6
---

# Solution #1: wire the layers by hand

<WiredBalloon />

<!--
One path for a single event (node address change), crossing three layers.
Every other event (cert expiry, config change, …) needs its own hand-built path.
-->

---
clicks: 4
---

# Wait, we've seen this before

<ReconcileLoop />

---

# Should we just put Kubernetes into Talos?

<div v-click class="big-no">No.</div>

<v-clicks>

- Hard to get a **minimal** Kubernetes <span class="tc-note">(at least back in 2020)</span>
- Talos boots with **no disk** and **no etcd**, on minimal resources
- Controllers and resources must run from **pure RAM**
- Debugging complex Kubernetes controllers wasn't fun <span class="tc-note">(Cluster API!)</span>

</v-clicks>

<style>
.big-no {
  margin: -8px 0 12px;
  font-size: 56px;
  font-weight: 800;
  line-height: 1;
  color: var(--tc-pink);
}
</style>

---
layout: two-cols-header
---

# So we reinvented the wheel: meet COSI

<div class="cosi-lead">

**C**ommon **O**perating **S**ystem **I**nterface: a minimal stack

</div>

::left::

<v-clicks>

- **Resources**: strictly defined metadata<br>(namespace, type, id, version, owner…) plus an opaque spec
- **Controller runtime**: controllers declare inputs and outputs; strict ownership, only the owner writes a resource
- **Reflects its state**: the graph of controllers and resources documents the system and its current state

</v-clicks>

::right::

<div v-click="1" class="cosi-code">

```yaml
metadata:
  namespace: network
  type: AddressStatuses.net.talos.dev
  id: eth0/172.20.0.2/24
  version: 1
  owner: network.AddressStatusController
  phase: running
spec:
  address: 172.20.0.2/24
  linkName: eth0
  family: inet4
  scope: global
```

</div>

<style>
.cosi-lead {
  margin: -12px 0 18px;
  color: var(--tc-muted);
}
.cosi-lead strong {
  color: var(--tc-pink);
}
.tc-col-left li {
  margin-bottom: 14px;
}
.cosi-code {
  --slidev-code-font-size: 13px;
  --slidev-code-line-height: 20px;
}
</style>

<!--
COSI runtime README: "A resource is a metadata plus opaque spec"; exclusive outputs are
managed by only a single controller, shared outputs can only be modified by the controller
which created them; "graph of dependencies between controllers and resources documents
system design and current state".
Example is `talosctl get addresses -o yaml` (network controllers landed in v0.11).
-->

---
layout: full
---

<TheatreDemo trace="talos-boot.jsonl" theme="projector" :speed="0.1" />

<!--
Demo: Reconciliation Theatre, a live replay of a Talos boot trace (controller runtime).
Viewer lives in public/theatre/ (vendored from the artifact); swap the trace by dropping a
new .jsonl into public/theatre/ and changing `trace=` above.
Clicking inside the demo moves keyboard focus into it: click the slide margin to get
slide navigation back. In the demo: Space = play/pause, ←/→ = seek 1s, T = cycle theme.
-->

---

# What controllers & resources gave Talos

<div class="benefits">
  <div v-click class="card c1">
    <h3>Inspection</h3>
    <p>Talos state through one unified API, with watches. Familiar to Kubernetes users.</p>
    <code>talosctl get addresses -w</code>
  </div>
  <div v-click class="card c2">
    <h3>Observability</h3>
    <p>Every resource, even intermediate ones, can be captured when a bug is suspected: more than logs, the actual state.</p>
    <code>talosctl support</code>
  </div>
  <div v-click class="card c3">
    <h3>Testability</h3>
    <p>Controllers are tested in isolation: resources in, assert on the resources out.</p>
  </div>
  <div v-click class="card c4">
    <h3>Modularity</h3>
    <p>Each controller is a small building block; a set of controllers is a module: network, Kubernetes, …</p>
  </div>
  <div v-click class="card c5">
    <h3>Reactivity</h3>
    <p>The OS reacts to changes, environmental or user‑initiated.</p>
  </div>
</div>

<style>
.benefits {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
  margin-top: -6px;
}
.card {
  grid-column: span 2;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 158px;
  padding: 12px 14px;
  border: 1.5px solid #d4d4d4;
  border-top: 6px solid var(--accent);
  border-radius: 8px;
}
.card.c4,
.card.c5 {
  grid-column: span 3;
  min-height: 120px;
}
.card h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--accent);
}
.card p {
  margin: 0;
  font-size: 15px;
  line-height: 1.3;
}
.card code {
  align-self: flex-start;
  margin-top: auto;
  font-size: 13px;
}
.c1 { --accent: var(--tc-pink); }
.c2 { --accent: var(--tc-purple); }
.c3 { --accent: var(--tc-blue); }
.c4 { --accent: var(--tc-teal); }
.c5 { --accent: #2a8a6e; }
</style>

<!--
Inspection: user-facing resources report Talos state via the resource API (`talosctl get`, `-w` to watch).
Observability: `talosctl support` bundles resources, even intermediate ones; they say more about
the current state than logs do.
Testability: inputs and outputs are both resources, so a controller test sets up inputs and
asserts on the shape of the outputs.
Modularity: small controllers, grouped into modules (network, Kubernetes, …).
Reactivity: back to the start of the talk: environmental changes (DHCP, cert expiry) and user changes
flow through the same controllers.
-->

---

# What happened next

<div class="next">
  <ol class="timeline">
    <li v-click>
      <span class="when">v0.9 · Mar 2021</span>
      <strong>Control plane</strong> on COSI: the first subsystem
    </li>
    <li v-click>
      <span class="when">v0.11 · Jul 2021</span>
      <strong>Networking</strong> rewritten on COSI
      <div class="sub">immediate network config changes, proper action on DHCP leases, operators, virtual IPs, observability</div>
    </li>
    <li v-click>
      <span class="when">v0.13 · Oct 2021</span>
      <strong>Member discovery</strong> and <strong>KubeSpan</strong>, built on COSI from day one
    </li>
    <li v-click>
      <span class="when">every release since</span>
      New features built on COSI, existing subsystems <strong>refactored</strong> onto it
    </li>
  </ol>

  <div v-click class="goal">
    <div class="goal-title">Goal: 100% reactive to any config change</div>
    <p>Not there yet: the sequential boot is still around, but it <strong>shrinks every release</strong></p>
    <div class="tiles">
      <div class="tile">
        <div class="tile-label">controllers</div>
        <div class="tile-value">14 <span>→</span> ~250</div>
        <div class="tile-sub">v0.9 → v1.14</div>
      </div>
      <div class="tile">
        <div class="tile-label">boot phases, sequential</div>
        <div class="tile-value">28 <span>→</span> 19</div>
        <div class="tile-sub">v0.8 → v1.14</div>
      </div>
    </div>
  </div>
</div>

<style>
.next {
  display: grid;
  grid-template-columns: 1fr 330px;
  column-gap: 32px;
  margin-top: -8px;
}
.timeline {
  position: relative;
  margin: 0;
  padding: 0 0 0 26px;
  list-style: none;
}
.timeline::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 8px;
  bottom: 44px;
  width: 2px;
  background: #d4d4d4;
}
.timeline li {
  position: relative;
  margin: 0 0 20px;
  font-size: 19px;
  line-height: 1.3;
}
.timeline li::before {
  content: '';
  position: absolute;
  left: -26px;
  top: 5px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--tc-teal);
  box-shadow: 0 0 0 3px #ffffff;
}
.timeline .when {
  display: block;
  font-family: var(--tc-font-mono);
  font-size: 13px;
  color: var(--tc-muted);
}
.timeline .sub {
  margin-top: 4px;
  font-size: 15px;
  color: var(--tc-muted);
}
.goal {
  align-self: start;
  padding: 16px 18px;
  border: 1.5px solid #d4d4d4;
  border-top: 6px solid var(--tc-pink);
  border-radius: 8px;
}
.goal-title {
  font-size: 21px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--tc-pink);
}
.goal p {
  margin: 10px 0 14px;
  font-size: 16px;
  line-height: 1.3;
}
.tiles {
  display: grid;
  gap: 10px;
}
.tile {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: baseline;
  column-gap: 12px;
  padding: 8px 14px;
  border-radius: 6px;
  background: #f3f3f3;
}
.tile-label {
  grid-column: 1 / -1;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--tc-muted);
}
.tile-value {
  margin: 2px 0;
  font-size: 26px;
  font-weight: 700;
  white-space: nowrap;
}
.tile-value span {
  font-weight: 400;
  color: var(--tc-muted);
}
.tile-sub {
  font-family: var(--tc-font-mono);
  font-size: 12px;
  color: var(--tc-muted);
}
</style>

<!--
Sources (siderolabs/talos git history):
- v0.9: "feat: replace bootkube with Talos-managed control plane", resource API introduced.
- v0.11: "feat: replace networkd with new network implementation" (LinkStatus, AddressStatus,
  route controllers, DHCP4/DHCP6 operators, virtual IP operator).
- v0.13: KubeSpan identity/peer controllers, cluster discovery registry, Affiliates.
- Controllers registered in machined: v0.9 14, v0.11 46, v0.13 65, v1.0 86, v1.14 ~250
  (the demo trace, v1.15 alpha, shows 254).
- Initialize + Boot sequencer phases (unique): v0.8 28, v1.14 19; gone from the sequence:
  discoverNetwork, setupNetwork, containerd, udevd, var, overlay, mountState, …
-->

---
clicks: 5
---

# Omni: COSI at fleet scale

<div class="omni-lead">

So confident in COSI that we **consciously** built Omni on top of it

</div>

<OmniCosi />

<style>
.omni-lead {
  margin: -14px 0 14px;
  color: var(--tc-muted);
}
</style>

<!--
- Omni uses COSI to look into Talos state (Talos resource API), and COSI inside Omni holds the
  state of machines and clusters.
- Every operation is a reconciliation: cluster creation, scale up / down, upgrades, …
- COSI grew with Omni: Talos keeps state in memory; Omni uses etcd-backed (cosi-project/state-etcd)
  and SQLite-backed (cosi-project/state-sqlite) state.
- Omni leans on QController (queue-based): reconciles one item at a time, items in parallel,
  per-item retries with backoff, vs Talos' Controller that reconciles all inputs at once.
- Same foundation across Omni and Talos.
-->

---

# We're just getting started

<div class="future">
  <div class="workload today">
    <div class="wl-name">Kubernetes</div>
    <div class="wl-sub">today</div>
  </div>
  <div v-click class="workload">
    <div class="wl-name">Bare containers</div>
    <div class="wl-sub">no Kubernetes needed</div>
  </div>
  <div v-click class="workload">
    <div class="wl-name">Virtual machines</div>
    <div class="wl-sub">Talos Hypervisor</div>
  </div>
  <div v-click class="foundation">
    <span><b>COSI</b> &amp; reconciliation</span>
    <span class="foundation-note">still powering everything</span>
  </div>
</div>

<div v-click class="future-punch">

Towards a **100% reactive** Talos, capable of running **any type of workload**

</div>

<style>
.future {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 4px;
}
.workload {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 110px;
  padding: 0 18px;
  border: 2px solid var(--tc-teal);
  border-radius: 10px;
  background: #eef7f8;
}
.workload.today {
  border-color: var(--tc-blue);
  background: #e9f0f8;
}
.wl-name {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.15;
}
.wl-sub {
  margin-top: 4px;
  font-size: 16px;
  color: var(--tc-muted);
}
.foundation {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  height: 50px;
  padding: 0 18px;
  border-radius: 10px;
  background: linear-gradient(90deg, var(--tc-pink), var(--tc-purple) 45%, var(--tc-blue));
  color: #ffffff;
  font-size: 19px;
}
.foundation-note {
  margin-left: auto;
  font-weight: 700;
}
.future-punch {
  margin-top: 30px;
  font-size: 26px;
  line-height: 1.25;
}
.future-punch strong {
  color: var(--tc-pink);
}
</style>

<!--
Coming next in Talos: running bare containers without Kubernetes, and running VMs
(Talos Hypervisor), both built on COSI and reconciliation like everything else.
We're just starting on a 100% reactive Talos that can run any type of workload.
-->

---
layout: end
contacts:
  - name: Andrey Smirnov
    role: Engineering Lead @ Sidero Labs
    email: andrey.smirnov@siderolabs.com
---
