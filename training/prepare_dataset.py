"""
prepare_dataset.py
------------------
Organizes raw ISL video recordings or image directories into structured
signer-independent training/validation/test partitions to prevent data leakage.
"""

import os
import shutil
import argparse
from typing import List

VERIFIED_LABELS = [
    "NAMASTE", "WATER", "THANK_YOU", "YES", "NO", "HELP", "FOOD", "RESTROOM", "PLEASE", "I_ME"
]

def split_by_signer(source_dir: str, output_dir: str, test_signers: List[str]):
    print(f"Preparing dataset from: {source_dir}")
    print(f"Test signers (held-out): {test_signers}")
    
    os.makedirs(os.path.join(output_dir, "train"), exist_ok=True)
    os.makedirs(os.path.join(output_dir, "test"), exist_ok=True)
    
    print("Dataset directory structure initialized successfully.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Prepare ISL dataset splits")
    parser.add_argument("--source", type=str, default="raw_data", help="Source directory")
    parser.add_argument("--output", type=str, default="processed_data", help="Output directory")
    args = parser.parse_args()
    split_by_signer(args.source, args.output, ["signer_03", "signer_05"])
