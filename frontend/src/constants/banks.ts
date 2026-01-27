export interface Bank {
  id: string;
  abbr: string;
  name: string;
  logo: string;
  color: string;
}

export const BANKS: Bank[] = [
  {
    id: "kbank",
    abbr: "KBANK",
    name: "กสิกรไทย",
    logo: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/KBANK.png",
    color: "#138f2d",
  },
  {
    id: "scb",
    abbr: "SCB",
    name: "ไทยพาณิชย์",
    logo: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/SCB.png",
    color: "#4e2e7f",
  },
  {
    id: "ktb",
    abbr: "KTB",
    name: "กรุงไทย",
    logo: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/KTB.png",
    color: "#1ba5e1",
  },
  {
    id: "bbl",
    abbr: "BBL",
    name: "กรุงเทพ",
    logo: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/BBL.png",
    color: "#1e4598",
  },
  {
    id: "ttb",
    abbr: "TTB",
    name: "ทหารไทยธนชาต",
    logo: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/TTB.png",
    color: "#0056ff",
  },
  {
    id: "bay",
    abbr: "BAY",
    name: "กรุงศรีอยุธยา",
    logo: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/BAY.png",
    color: "#fec43b",
  },
  {
    id: "gsb",
    abbr: "GSB",
    name: "ออมสิน",
    logo: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/GSB.png",
    color: "#eb198d",
  },
  {
    id: "tisco",
    abbr: "TISCO",
    name: "ทิสโก้",
    logo: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/TISCO.png",
    color: "#123f6d",
  },
  {
    id: "kkp",
    abbr: "KKP",
    name: "เกียรตินาคินภัทร",
    logo: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/KKP.png",
    color: "#694d8b",
  },
  {
    id: "cimb",
    abbr: "CIMB",
    name: "ซีไอเอ็มบีไทย",
    logo: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/CIMB.png",
    color: "#7e2f36",
  },
  {
    id: "uob",
    abbr: "UOB",
    name: "ยูโอบี",
    logo: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/UOB.png",
    color: "#0b3979",
  },
  {
    id: "lhb",
    abbr: "LH BANK",
    name: "แลนด์ แอนด์ เฮ้าส์",
    logo: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/LHB.png",
    color: "#6d6e71",
  },
  {
    id: "baac",
    abbr: "BAAC",
    name: "ธ.ก.ส.",
    logo: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/BAAC.png",
    color: "#4b9b1d",
  },
  {
    id: "ghb",
    abbr: "GHB",
    name: "อาคารสงเคราะห์",
    logo: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/GHB.png",
    color: "#f57d23",
  },
];

export const getBankById = (id: string): Bank | undefined =>
  BANKS.find((bank) => bank.id === id);
