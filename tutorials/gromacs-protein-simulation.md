---
title: Protein simulation in water
tool: GROMACS
level: Beginner
time: About 2 hours, plus simulation time
updated: October 2026
---

This tutorial takes a small protein from a PDB file to a 1 ns production run in explicit water, then checks that the simulation is stable. We use hen egg-white lysozyme (PDB **1AKI**) because it is small, well studied and simulates quickly.

> **Before you start.** You need GROMACS 2023 or newer (`gmx --version`), a terminal, and a way to plot `.xvg` files (xmgrace, or Python with matplotlib). On TRUBA or another cluster, load the GROMACS module first.

## 1. Prepare the structure

Download the structure and remove crystal waters. We add our own water later.

```bash
wget https://files.rcsb.org/download/1AKI.pdb
grep -v HOH 1AKI.pdb > 1AKI_clean.pdb
```

Always open the structure in a viewer (PyMOL, VMD or ChimeraX) before simulating. Look for missing residues, alternate conformations and ligands that the force field will not recognise.

## 2. Build the topology

`pdb2gmx` adds hydrogens, assigns force-field parameters and writes the topology.

```bash
gmx pdb2gmx -f 1AKI_clean.pdb -o processed.gro -p topol.top \
            -ff amber99sb-ildn -water tip3p -ignh
```

| Output | What it contains |
| --- | --- |
| `processed.gro` | Coordinates with hydrogens added |
| `topol.top` | Force-field parameters for the protein |
| `posre.itp` | Position restraints used during equilibration |

## 3. Box, water and ions

Centre the protein in a rhombic dodecahedron with at least 1.0 nm to the box edge, fill it with water, then neutralise and add 0.15 M NaCl.

```bash
gmx editconf -f processed.gro -o newbox.gro -c -d 1.0 -bt dodecahedron
gmx solvate  -cp newbox.gro -cs spc216.gro -o solv.gro -p topol.top

gmx grompp -f ions.mdp -c solv.gro -p topol.top -o ions.tpr
echo SOL | gmx genion -s ions.tpr -o solv_ions.gro -p topol.top \
                      -pname NA -nname CL -neutral -conc 0.15
```

`ions.mdp` can be the same file as `em.mdp` below; `grompp` only needs it to build a run input.

## 4. Energy minimisation

Minimisation removes steric clashes left over from solvation.

```ini
; em.mdp
integrator    = steep
emtol         = 1000.0
emstep        = 0.01
nsteps        = 50000
cutoff-scheme = Verlet
nstlist       = 10
coulombtype   = PME
rcoulomb      = 1.0
rvdw          = 1.0
pbc           = xyz
```

```bash
gmx grompp -f em.mdp -c solv_ions.gro -p topol.top -o em.tpr
gmx mdrun -v -deffnm em
echo Potential | gmx energy -f em.edr -o potential.xvg
```

The potential energy should drop steeply and level off at a large negative value. If `mdrun` stops with a very high maximum force, go back and check the structure.

## 5. Equilibration: NVT, then NPT

First bring the system to 300 K at constant volume, with the protein heavy atoms restrained.

```ini
; nvt.mdp
define                  = -DPOSRES
integrator              = md
nsteps                  = 50000     ; 100 ps
dt                      = 0.002
nstxout-compressed      = 500
nstenergy               = 500
nstlog                  = 500
continuation            = no
constraint_algorithm    = lincs
constraints             = h-bonds
cutoff-scheme           = Verlet
nstlist                 = 10
rcoulomb                = 1.0
rvdw                    = 1.0
DispCorr                = EnerPres
coulombtype             = PME
fourierspacing          = 0.16
tcoupl                  = V-rescale
tc-grps                 = Protein Non-Protein
tau_t                   = 0.1 0.1
ref_t                   = 300 300
pcoupl                  = no
pbc                     = xyz
gen_vel                 = yes
gen_temp                = 300
gen_seed                = -1
```

For NPT, copy `nvt.mdp` to `npt.mdp` and change these lines:

```ini
; npt.mdp — changes from nvt.mdp
continuation     = yes
gen_vel          = no
pcoupl           = C-rescale
pcoupltype       = isotropic
tau_p            = 2.0
ref_p            = 1.0
compressibility  = 4.5e-5
refcoord_scaling = com
```

```bash
gmx grompp -f nvt.mdp -c em.gro  -r em.gro  -p topol.top -o nvt.tpr
gmx mdrun -deffnm nvt

gmx grompp -f npt.mdp -c nvt.gro -r nvt.gro -t nvt.cpt -p topol.top -o npt.tpr
gmx mdrun -deffnm npt
```

Check that temperature (NVT) and pressure and density (NPT) fluctuate around their targets with `gmx energy` before moving on.

## 6. Production run

Copy `npt.mdp` to `md.mdp`, remove the `define = -DPOSRES` line and set `nsteps = 500000` for 1 ns.

```bash
gmx grompp -f md.mdp -c npt.gro -t npt.cpt -p topol.top -o md.tpr
gmx mdrun -deffnm md
```

On a GPU node, GROMACS offloads non-bonded interactions automatically. On TRUBA, submit this step as a batch job instead of running it on the login node.

## 7. First analysis

Remove periodic-boundary jumps, then measure backbone RMSD and radius of gyration.

```bash
printf "Protein\nSystem\n" | gmx trjconv -s md.tpr -f md.xtc -o md_noPBC.xtc -pbc mol -center
printf "Backbone\nBackbone\n" | gmx rms -s md.tpr -f md_noPBC.xtc -o rmsd.xvg -tu ns
echo Protein | gmx gyrate -s md.tpr -f md_noPBC.xtc -o gyrate.xvg
```

A stable folded protein shows a backbone RMSD that rises in the first few hundred picoseconds and then plateaus, usually below about 0.2 nm for lysozyme, with a roughly constant radius of gyration.

## Next steps

- Extend the run to 100 ns or longer and run replicas with different `gen_seed` values.
- Cluster the trajectory (`gmx cluster`) to pick representative structures for docking.
- Continue with our free energy tutorial in Amber.
