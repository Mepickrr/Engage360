import { createCampaign, fetchCampaign, updateCampaign } from "../campaignsApi";

beforeEach(() => {
  window.localStorage.clear();
});

describe("campaignsApi", () => {
  it("createCampaign persists a doc with a generated id", async () => {
    const doc = await createCampaign({ meta: { name: "Test" }, sequence: [] });
    expect(doc.id).toBeTruthy();
    expect(doc.meta.name).toBe("Test");
    expect(doc.createdAt).toBeTruthy();
  });

  it("fetchCampaign returns a previously created doc", async () => {
    const created = await createCampaign({ meta: { name: "Test" }, sequence: [] });
    const fetched = await fetchCampaign(created.id);
    expect(fetched).toEqual(created);
  });

  it("fetchCampaign rejects for an unknown id", async () => {
    await expect(fetchCampaign("nope")).rejects.toThrow("Campaign nope not found");
  });

  it("updateCampaign merges a patch and bumps updatedAt", async () => {
    const created = await createCampaign({ meta: { name: "Test" }, sequence: [] });
    const updated = await updateCampaign(created.id, { meta: { name: "Renamed" } });
    expect(updated.meta.name).toBe("Renamed");
    expect(updated.id).toBe(created.id);
    expect(updated.updatedAt).toBeTruthy();
  });
});
