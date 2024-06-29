import { useAccount, useEnsName } from "wagmi";

export function Profile() {
  const { address } = useAccount();
  const { data, error, status } = useEnsName({
    address: "0xA1542A9F42745dad0D968B0E93fb81071e53582d",
  });
  if (status === "pending") return <div>Loading ENS name</div>;
  if (status === "error")
    return <div>Error fetching ENS name: {error.message}</div>;
  return <div>ENS name: {data}</div>;
}
